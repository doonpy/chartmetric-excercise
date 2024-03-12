/**
 * these are defined in an external queries file but
 * added here as a comment for additional context
 *
 * QUERIES.QUERY_GET_ARTIST_INFO.ARTIST_INSIGHTS

 module.exports {
 ...
 GET_INSIGHTS_COUNT: (cm_artist, highWeight, mediumWeight, daysAgo) => `
 SELECT COUNT(*) as "count"
 FROM chartmetric.analytics.cm_artist_insights ai
 JOIN chartmetric.analytics.cm_artist_insights_weight aiw ON ai.target = aiw.target AND ai.type = aiw.type
 WHERE cm_artist = ${cm_artist}
 AND weight >= ${highWeight}
 AND timestp >= current_date - ${daysAgo}
 UNION
 SELECT COUNT(*) as "count"
 FROM chartmetric.analytics.cm_artist_insights ai
 JOIN chartmetric.analytics.cm_artist_insights_weight aiw ON ai.target = aiw.target AND ai.type = aiw.type
 WHERE cm_artist = ${cm_artist}
 AND weight >= ${mediumWeight}
 AND timestp >= current_date - ${daysAgo}
 `,
 GET_ARTIST_INSIGHTS: (cm_artist, limit, weight, daysAgo) => `
 WITH insights AS (
 SELECT ai.*, aiw.weight
 FROM chartmetric.analytics.cm_artist_insights ai
 JOIN chartmetric.analytics.cm_artist_insights_weight aiw ON ai.target = aiw.target AND ai.type = aiw.type
 WHERE cm_artist = ${cm_artist}
 AND weight >= ${weight}
 AND timestp >= current_date - ${daysAgo}
 ORDER BY timestp DESC, weight DESC
 LIMIT ${limit}
 )
 , artist AS (
 SELECT
 DISTINCT i.cm_artist,
 t.image_url AS artist_url
 from insights i
 JOIN raw_data.cm_artist t ON i.cm_artist = t.id
 )
 , track as (
 SELECT
 DISTINCT i.cm_track,
 t.image_url AS track_url
 FROM insights i
 JOIN raw_data.cm_track t ON i.cm_track = t.id
 )
 , album AS (
 SELECT
 DISTINCT i.cm_album,
 t.image_url AS album_url
 FROM insights i
 JOIN raw_data.cm_album t ON i.cm_album = t.id
 )
 SELECT i.* ,
 album.album_url,
 track.track_url,
 artist.artist_url
 FROM insights i
 LEFT JOIN album ON i.cm_album = album.cm_album
 LEFT JOIN track ON i.cm_track = track.cm_track
 LEFT JOIN artist ON i.cm_artist = artist.cm_artist
 `,
 ...
 };
 */

const QUERIES = {
  QUERY_GET_ARTIST_INFO: {
    ARTIST_INSIGHTS: {
      GET_INSIGHTS_COUNT: (cm_artist, highWeight, mediumWeight, daysAgo) => `
          SELECT COUNT(*) as "count"
          FROM chartmetric.analytics.cm_artist_insights ai
                   JOIN chartmetric.analytics.cm_artist_insights_weight aiw
                        ON ai.target = aiw.target AND ai.type = aiw.type
          WHERE cm_artist = ${cm_artist}
            AND weight >= ${highWeight}
            AND timestp >= current_date - ${daysAgo}
          UNION
          SELECT COUNT(*) as "count"
          FROM chartmetric.analytics.cm_artist_insights ai
                   JOIN chartmetric.analytics.cm_artist_insights_weight aiw
                        ON ai.target = aiw.target AND ai.type = aiw.type
          WHERE cm_artist = ${cm_artist}
            AND weight >= ${mediumWeight}
            AND timestp >= current_date - ${daysAgo}
      `,
      GET_ARTIST_INSIGHTS: (cm_artist, limit, weight, daysAgo) => `
          WITH insights AS (SELECT ai.*, aiw.weight
                            FROM chartmetric.analytics.cm_artist_insights ai
                                     JOIN chartmetric.analytics.cm_artist_insights_weight aiw
                                          ON ai.target = aiw.target AND ai.type = aiw.type
                            WHERE cm_artist = ${cm_artist}
                              AND weight >= ${weight}
                              AND timestp >= current_date - ${daysAgo}
                            ORDER BY timestp DESC, weight DESC
              LIMIT ${limit}
              )
             , artist AS (
          SELECT
              DISTINCT i.cm_artist, t.image_url AS artist_url
          from insights i
              JOIN raw_data.cm_artist t
          ON i.cm_artist = t.id
              )
              , track as (
          SELECT
              DISTINCT i.cm_track, t.image_url AS track_url
          FROM insights i
              JOIN raw_data.cm_track t
          ON i.cm_track = t.id
              )
              , album AS (
          SELECT
              DISTINCT i.cm_album, t.image_url AS album_url
          FROM insights i
              JOIN raw_data.cm_album t
          ON i.cm_album = t.id
              )
          SELECT i.*,
                 album.album_url,
                 track.track_url,
                 artist.artist_url
          FROM insights i
                   LEFT JOIN album ON i.cm_album = album.cm_album
                   LEFT JOIN track ON i.cm_track = track.cm_track
                   LEFT JOIN artist ON i.cm_artist = artist.cm_artist
      `,
    }
  }
}

async function snowflakeClientExecuteQuery(query) {
  return [];
}

function filterResults(results) {
  return [];
}

async function formatInsight(insight) {
  return {};
}

async function insightToNews(insight) {
  return {};
}

async function getArtistInsights(query) {
  let {id, limit, weight, daysAgo, newsFormat} = query;
  const HIGH_WEIGHT = 8;
  const MEDIUM_WEIGHT = 4;
  const LOW_WEIGHT = 1;
  const [high, medium] = (await snowflakeClientExecuteQuery(
    QUERIES.QUERY_GET_ARTIST_INFO.ARTIST_INSIGHTS.GET_INSIGHTS_COUNT(
      id,
      HIGH_WEIGHT,
      MEDIUM_WEIGHT,
      daysAgo
    )
  )).map(result => result.count);
  weight = weight !== undefined ? weight : high ? HIGH_WEIGHT : medium ? MEDIUM_WEIGHT : LOW_WEIGHT;

  const artistInsights = (await snowflakeClientExecuteQuery(
    QUERIES.QUERY_GET_ARTIST_INFO.ARTIST_INSIGHTS.GET_ARTIST_INSIGHTS(
      id,
      limit * 10,
      weight,
      daysAgo
    )
  ))

  const filteredResults = (await Promise.all(
    filterResults(artistInsights).map(insight => formatInsight(insight))
  )).filter(e => e !== null).slice(0, limit + (10 - weight) * 200);
  const newsList = await Promise.all(
    filteredResults.map(result => (newsFormat ? insightToNews(result) : result))
  );

  return newsFormat ? {insights: newsList, weight} : newsList;
}
