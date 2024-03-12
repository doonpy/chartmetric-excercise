select u.id       as user_id,
       u.username as username,
       u.email    as email,
       a.id       as artist_id,
       a.tagline  as tagline,
       t.name     as track_name,
       t.isrc     as track_isrc
from users u
         left join public.artists a on u.id = a.user_id
         left join public.tracks t on a.id = t.artist_id
where a.id is not null;
