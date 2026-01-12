create view WinRateYesterday as
  select a.userId as userId, cast(winCount as real)/cast(participantsCount as real) as wr, rank() over (order by cast(winCount as real)/cast(participantsCount as real) desc) as place
    from (
      select userId, count(*) as participantsCount
        from Record
        where matchDateId != (select id from MatchDate order by id desc limit 1)
        group by userId
    ) as a join (
      select userId, count(*) as winCount
        from Record
        where place = 1 and matchDateId != (select id from MatchDate order by id desc limit 1)
        group by userId
    ) as b on a.userId = b.userId;

create view DeltaTimeMsAvgYesterday as
  select a.userId as userId, avg(b.dt) as dtAvg, rank() over (order by avg(b.dt) asc) as place
    from Record as a join (
      select a.id as recordId,
        cast(unixepoch(a.postedAt, 'subsec') * 1000 as integer) -
        cast(unixepoch(b.date, 'subsec') * 1000 as integer)
      as dt
        from Record as a right join MatchDate as b on a.matchDateId = b.id
        where a.matchDateId != (select id from MatchDate order by id desc limit 1)
    ) as b on a.id = b.recordId
    where b.dt >= 0
    group by a.userId;

create view WinRatePlace as
  select *, rank() over (order by wr desc) as place
  from WinRate;

create view DeltaTimeMsAvgPlace as
  select *, rank() over (order by dtAvg asc) as place
  from DeltaTimeMsAvg;

create view UserRankYesterday as
  select userId, pt, rank() over (order by pt desc) as place
  from UserRankHistory
  where matchId = (select id from MatchDate order by id desc limit 1 offset 1);
