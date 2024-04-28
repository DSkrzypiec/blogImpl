---
date: "2024-04-19"
tags: ["data-engineering", "Go"]
title: "Implementing cron"
toc: false
draft: false
---


## Intro

Recently I've been writing down documentation for [ppacer
schedules](https://ppacer.org/internals/schedules/) and in that moment I
thought I should have probably implemented cron schedule for ppacer. Before I
explain why I thought that, let's take one step back first, to give you a bit
of context about ppacer schedules. Schedules in ppacer are covered by generic
and simple interface


```
type Schedule interface {
    Start() time.Time
    Next(curentTime time.Time, prevSchedule *time.Time) time.Time
    String() string
}
```

Initially I've provided the simplest possible regular schedule which satisfies
that interface - `schedule.Fixed`
([docs](https://pkg.go.dev/github.com/ppacer/core/dag/schedule#Fixed)) which
starts at given time and ticks each given `time.Duration` (e.g.
`10*time.Minute`). That was definitely good enough for the first ppacer backed
versions and tests.

I thought having a generic interface for schedules and providing simple
concrete implementation would be enough for the MVP ppacer version, but then
when I was writing docs on this topic I thought it would be great to also cover
cron. Why? There are few reasons. Cron is classic and influential scheduler
from *-UNIX world. Cron expressions became so common that they are popping out
not only in modern schedulers but also in business applications. I felt
obligated, to support cron expressions, since I'm implementing my own
scheduler. Also I thought it might be quick and interesting tangent to my
project. It wasn't really quick, but it was interesting.


## cron 101

Let me start by quickly introducing cron. Cron is a command-line program on
Unix-like systems for scheduling jobs. Cron job can be added, listed or deleted
using `crontab` program. Usually when we want to add new job, we need to
specify a schedule for that job and what action needs to be performed. This
definition looks like this (lines starting with `#` are comments):


```
# Example of job definition:
# .---------------- minute (0 - 59)
# |  .------------- hour (0 - 23)
# |  |  .---------- day of month (1 - 31)
# |  |  |  .------- month (1 - 12) OR jan,feb,mar,apr ...
# |  |  |  |  .---- day of week (0 - 6) (Sunday=0 or 7)
# |  |  |  |  |
# *  *  *  *  * user-name command to be executed
17 * * * *      root    cd / && run-parts --report /etc/cron.hourly
```

In the example above we can see that there is only one cron job defined. It
runs on schedule `17 * * * *` (at 17th minute of every hour, every day),
should be performed as user `root` and should execute bash command


```
cd / && run-parts --report /etc/cron.hourly
```

We can say that cron is a Linux (daemon) process which runs in the background,
wakes up once a minute, reads its database (`crontab` file), checks if given
jobs should be executed based on current time and job cron expression, if
that's the case it executes job's command or script.

Cron is still used nowadays mainly because it's available on every *-UNIX OS
I've ever touched and it's very easy to setup. If you need to run rather simple
task on a schedule and you're on Linux, it might be good choice. There's also a
downside. It's so simple that it lacks monitoring and alerting for cases when
job fails.


## cron history

Cron has been introduced as command utility program in Version 7 UNIX in 1979.
That version was implemented by Ken Thompson. Initially it was just `cron`
program without, mentioned earlier, `crontab`. Jobs by default were stored in
`/usr/lib/crontab`.

When it comes to Linux, most distribution uses cron implementation done by Paul
Vixie or their own version created based on "Vixie cron". That cron version was
implemented by Paul in 1988 with another releases in 1990, 1993 and 1994.

Over the last two decades cron and cron expressions for schedules became a
standard for expressing regular intervals using just a few characters. Most (if
not every) mainstream programming languages has at least one library which
helps parsing cron expressions and use it in your application. Few examples of
such libraries:

* [croniter](https://github.com/kiorky/croniter) - Python library which
  provides iterator for the datetime object with a cron like format. Apache
  Airflow uses this library.
* [node-cron](https://www.npmjs.com/package/node-cron) - JavaScript module
  which implements tiny task scheduler supporting crontab syntax.
* [NCrontab](https://github.com/atifaziz/NCrontab) - C# library for parsing
  crontab expressions and calculating schedule based on those expressions.
* [cron](https://docs.rs/cron/latest/cron/) Rust crate - "A cron expression
  parser and schedule explorer".

There's even classic [crontab.guru](https://crontab.guru) which can help
learning cron expressions syntax or just help to prepare syntax for desired
schedule, so you can forget about it few minutes later.

What I meant presenting those examples is the fact that cron and crontab
expressions has gone mainstream for over 20-30 years regarding defining simple,
yet effective schedules, not only in cron itself.


## Preparing for the implementation

My cron schedule implementation for ppacer is something different, then
original cron's. In cron there is no need to know when the next schedule entry
should be. Cron basically at given time checks whenever there's a job with
crontab expression matching the current time. This is much simpler, then for
given time and crontab expression calculate when the next schedule entry should
be.

Since original cron source code wasn't helpful I tried to look into few
libraries which implements similar thing, before I started working on my
implementation. Few of them used approach which roughly goes as "increment
time, check if new point in time matches schedule definition and if not, keep
doing it". I didn't like it. When I look at crontab expression and a timestamp
I can immediately tell when the next one should be. Based on my intuition, I
thought my algorithm for calculation next timestamp in a cron schedule should
run in constant time `O(1)`.

Before I go into details and thoughts on my implementation, let me tell you
what I have found out about crontab expressions that I didn't know before
start working on it.

Just out of curiosity I looked into the Vixie cron implementation and I found
the following comment:

```
/* the dom/dow situation is odd.  '* * 1,15 * Sun' will run on the
 * first and fifteenth AND every Sunday;  '* * * * Sun' will run *only*
 * on Sundays;  '* * 1,15 * *' will run *only* the 1st and 15th.  this
 * is why we keep 'e->dow_star' and 'e->dom_star'.  yes, it's bizarre.
 * like many bizarre things, it's the standard.
 */
```

I didn't know about that! So when you have `0 10 13 * 1` crontab expression for
your schedule, it should run at 10:00AM on 13th day of a month and on every
Monday at 10:00AM. Naturally I thought it would mean that job should run at
10:00AM on 13th day of a month but only when it's Monday. Wrong! Though I've
never used such schedule in my life it's good to know that this part is a bit
inconsistent. There is logical `AND` between all parts of crontab expression
parts, except the case when day of month and weekday is set, in this case we
have logical `OR`. Exactly like Paul said, "yes, it's bizarre".

Another one comes from `crontab(5)` Linux man page, section `BUGS`:

```
If you are in one of the 70-odd countries that observe Daylight Savings Time,
jobs scheduled during the rollback or advance will be affected. In general, it
is not a good idea to schedule jobs during this period.
```

That's unfortunate. So when you use cron in timezone with DST and you specified
`0 2 * * *` schedule for your job, depending in which way time is changed,
might not run at all or run twice at the same day, even though you expect it to
run once a day at 2:00AM. Another question in this case is when the next
schedule point should be "correctly" calculated? We'll talk a bit about it in
the next chapter.


## Implementation

I started my implementation by designing a structure for crontab expressions.

```
type Cron struct {
    start      time.Time
    minute     []int
    hour       []int
    dayOfMonth []int
    month      []int
    dayOfWeek  []int
}
```

No matter how we would get those number (either parsing a string or setting
those manually, or using another API), eventually, crontab expression can be
boiled down to a list of values for each part. Assuming that empty array means
`*` (a start). Field `start` is just for `Schedule` interface `Start()` method.

I started slow by trying to support only `minute` and `hour` cases. That was
rather easy. In default crontab expression when we have starts when we just set
the next minute. Easy. Next is the case when we have at least one value
`minute` field. Let's say we have `15,50 * * * *` schedule, that means
`minute` is a slice with two values `[]int{15, 50}` (we can assume is sorted).
In this case, for given `time.Time` we need to check the next value in `minute`
which is greater then a minute from that time. If given time is `2024-04-25
12:19:00` then the next one should be at `12:50:00`. When we are already at
`12:51:10`, there is no "next" minute in `minute` field, so we know that the
next schedule point will be in the next hour and at `minute[0]` minute. Easy.

As you can probably see, the same reasoning applies to hours. So far so good.
We can correctly determine the next schedule point using just few `if`s,
integer comparisons and great Go standard [time
package](https://pkg.go.dev/time), especially [Add
method](https://pkg.go.dev/time#Time.Add).

The above looks in code like this:


```
func (c *Cron) setMinutes(t time.Time) time.Time {
    minutesSet, nextMinute := findNextInt(c.minute, t.Minute(), false)
    if !minutesSet {
        // regular * case
        return t.Add(time.Minute)
    }
    if nextMinute > 0 {
        // Another minute in the current hour
        return setMinute(t, nextMinute)
    }
    // in this case we need to increase hour and set minutes
    return setMinute(t.Add(time.Hour), c.minute[0])
}
```

For hours part implementation looks almost the same. That's also true for
"months" part of crontab expression.

A bit different approach is needed in case of day of month part. We cannot
apply the same logic in here. Let me, once again, start by providing an
example. Let's say we have cron schedule `0 12 31 * *` - expected runs should
be at noon on 31th day of a month. For this schedule let's consider several
pairs of timestamps and correspondent next schedule points:

* `next(2024-01-15 13:15) = 2024-01-31 12:00`
* `next(2024-01-31 13:15) = 2024-03-31 12:00`
* `next(2024-02-01 20:15) = 2024-03-31 12:00`

As we can see, we cannot simply set a day from `Cron.dayOfMonth` field, because
it might be invalid date! In the above example `2024-02-31 12:00` would be
invalid date. Another example, even more extreme would be `0 12 29 2 *`
schedule which should run at noon on February 29th, that's valid only on leap
years! So for `2024-02-29 12:01`, the next schedule point should be on
`2028-02-29 12:00` - four years later! That already sounds more complex
than handling minute or hour parts and we don't even yet included weekdays! I
won't put implementation details in here, but as you might except we cannot get
away without a loop in this case. Fortunately there are finite and small upper
limit of all possible iterations (<100), so we still should have `O(1)`
complexity, just with a bit larger constant for those cases.

The last part we need to cover is weekday part. As we already mentioned earlier
this part is a bit tricky, because it behaves differently than other parts.
Because of the fact that we either need to set a day of month or a
weekday, depending on a schedule and which case is closer to the current date,
there is no other way but include that logic in a function responsible for
determining setting up next day date. If only day of month in crontab is set,
it's easy. If only weekday in crontab is set, that's also rather
straightforward. In case when both parts are set, we need to calculate which of
those two option would happen first. It's not difficult either, but there are a
couple of cases we need to get right.

At the end, on high level, function `Next` for `Cron` looks like this:

```
func (c *Cron) Next(currentTime time.Time, _ *time.Time) time.Time {
    next := zeroSecondsAndSubs(currentTime)
    next = c.setMinutes(next)
    next = c.setHours(next)
    next = c.setDayOfMonth(next) // This also includes weekdays
    next = c.setMonth(next)
    return next
}
```

At the end implementing `Next` for cron schedule was a bit annoying. It wasn't
hard, but I needed to got every case right and there were a lot of cases to
cover. Looking back, should I've chosen a simpler path and just iterate over
dates and check if it's right? Perhaps it would be simpler to implement and
easier to maintain, but it would be probably a bit slower. Maintenance isn't
really the issue. There is nothing to maintain in here. It's one of things that
need to be implemented correctly and won't be changed probably ever. It's
rather small and closed (regarding specs) feature. Given that I implemented it
correctly I still think I did the right thing and being a bit more annoying for
me to implement is rather small price to pay in the long term perspective.


## To parse or not to parse




## Performance benchmarks


* Default `* * * * *` schedule case - 93.43 ns/op (0 B/op, 0 allocs/op)
* Schedule with minute and hour set - 218.5 ns/op (0 B/op, 0 allocs/op)
* All parts set except minute and hour - 580.1 ns/op (24 B/op, 2 allocs/op)
* All parts set - 695.4 ns/op (24 B/op, 2 allocs/op)
* February 29th case - 1860 ns/op (432 B/op, 18 allocs/op)

## Summary

TODO


## References

1. [Cron Wikipedia](https://en.wikipedia.org/wiki/Cron)
1. [Version 7 UNIX (mirror)
   cron](https://github.com/v7unix/v7unix/blob/a19130f05356581fe12d635a4cce4d8556a33171/v7/usr/src/cmd/cron.c)
1. [Paul Vixie cron in
   Debian](https://salsa.debian.org/debian/cron/-/blob/master/cron.c?ref_type=heads)
1. [Quora post with screenshot of email from Brian
   Kernighan](https://www.quora.com/What-is-the-etymology-of-cron/answer/Kah-Seng-Tay)
1.
