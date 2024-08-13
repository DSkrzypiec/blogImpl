---
date: "2024-08-13"
tags: ["Go"]
title: "Be Cautious When Using time.Time as Keys in Go Maps"
toc: false
draft: false
---


## Intro

Recently, I encountered a strange bug in [ppacer](https://ppacer.org). The
scheduler had a bug that only appeared on Linux, which was particularly
concerning since it directly affected ppacer's core functionality: scheduling.

Before we dive into the details, I want to mention that throughout the
development of ppacer, I rarely encountered issues that took more than a few
minutes to debug. However, this particular bug took me 4-5 hours to track down.
That why I thought that this behavior might not be obvious to others as well.
So, I’d like to share what I’ve learned.

I'll try to focus on the bug and solution in abstraction, without getting into
details of ppacer internal types and logic.


## Symptoms

Using ppacer I wanted to schedule and execute a process which after the first
task has another two concurrent tasks, to be scheduled. The first task was
scheduled and executed successfully, but then its children never got scheduled.
No errors, nothing. They simply won't schedule.

This issue occurred on a relatively modest EC2 instance (2GB RAM, 2 vCPU)
running Linux. Strangely, the exact same program ran perfectly on Windows and
macOS (MacBook Air M1). That was puzzling. For context, ppacer is built with Go
1.22, and its only dependency is a driver for SQLite.


## Debugging

Initially, I thought the issue might be due to the limited resources on the
mentioned EC2 instance. However, ppacer generally doesn't consume much in terms
of resources, and the particular example in question was relatively simple, so
that didn't seem to be the case. Checking the process metrics confirmed that
everything was running smoothly.

After running the same program with logging enabled at the `DEBUG` level, I
discovered that the child tasks weren't getting scheduled because the parent
task's status in the cache was `SCHEDULED` rather than `SUCCESS`.

I couldn't figure out how this was possible. The logs clearly showed that the
correct `SUCCESS` status was stored in the cache, but when another goroutine
retrieved the value from the cache for the same key, it returned `SCHEDULED`
instead. That made no sense at all! This particular LRU cache was designed to
be thread-safe—or as we should say, goroutine-safe. I increased logging,
checked for race conditions, and even tried using a much simpler cache—a
regular Go map with a `mutex`. Still nothing…

Since I had exhausted all ideas related to concurrency, I decided to look into
the cache itself. It would have been strange if I had misused a regular Go map
protected by `sync.Mutex`, but I didn't have any better ideas. Then I noticed
these log lines:

```
time=2024-08-12T11:30:00.140Z level=WARN msg="Cache info!" len=2
time=2024-08-12T11:30:00.140Z level=WARN msg="  --{{DagId:hello_world_dag AtTime:2024-08-12 11:30:00 +0000 UTC TaskId:start}}:
    {{Status:SCHEDULED StatusUpdateTs:2024-08-12 11:30:00.119866267 +0000 UTC}}\n"
time=2024-08-12T11:30:00.140Z level=WARN msg="  --{{DagId:hello_world_dag AtTime:2024-08-12 11:30:00 +0000 UTC TaskId:start}}:
    {{Status:RUNNING StatusUpdateTs:2024-08-12 11:30:00.138728617 +0000 UTC}}\n"
```

That’s interesting! We have two entries in the cache that seem to have
identical keys but different values. How is this possible? It’s simple: those
keys are actually different, even though they look identical. How is that
possible? We’ll talk about it in a moment.


## `time.Time` in Go map keys

In ppacer, when task execution is completed, `exec.Executor` sends its status
back to the Scheduler via an HTTP request. The ppacer Scheduler then updates
its task cache and persists that information in the database.

All right, but how those key in the cache looks the same but are not the same?
It's because `time.Time`, besides regular "wall clock", contains also
information about [monotonic
clock](https://pkg.go.dev/time#hdr-Monotonic_Clocks). Timestamps `t1` and `t2`
might present the same date, time and timezone information but when "monotonic
clock" values are different, then those object will be different and would be
treated as different keys when used in a dictionary.

That makes sense, but why did I observe different behaviour on different
platforms in ppacer? There are two reasons. First, the behavior of monotonic
clocks is determined by an operating system. Second, the monotonic clock value
is rather useless outside of the process in which it's being used, so that part
of `time.Time` is skipped in serialization. Since Executor sends updated status
for given task (`{DagId string, ExecTs time.Time, TaskId string}`) via HTTP, it
needs to serialize that data.


## Reproducible example

Let's consider the following simple Go program:


```
package main

import (
        "fmt"
        "time"
)

const TimestampFormat = "2006-01-02T15:04:05.999999MST-07:00"

type Key struct {
    Name      string
    Timestamp time.Time
}

func main() {
    const name = "Damian"

    cache := make(map[Key]int)

    now := time.Date(2024, 8, 12, 16, 5, 0, 0, time.Local)
    k1 := Key{Name: name, Timestamp: now}
    cache[k1] = 42

    // serialize and deserialize
    nowStr := now.Format(TimestampFormat)
    now2, _ := time.Parse(TimestampFormat, nowStr)
    k2 := Key{Name: name, Timestamp: now2}
    cache[k2] = -123

    for k, v := range cache {
            fmt.Printf("  -%v: %d\n", k, v)
    }
}
```

The program defines a dictionary that maps Key onto integers. We then define a
constant timestamp now and add an entry to the cache. After that, we serialize
and deserialize the same timestamp and use it in another key for our cache.
Finally, we print the contents of the cache.

When we compile and run that program using Go 1.22 on macOS we got the
following output:

```
  -{Damian 2024-08-12 16:05:00 +0200 CEST}: -123
```

Single entry in the cache with updated value (from 42 to -123). Let's take a
look what's the output when running the same program, also using Go 1.22, but
on Debian:

```
  -{Damian 2024-08-12 16:05:00 +0000 UTC}: 42
  -{Damian 2024-08-12 16:05:00 +0000 UTC}: -123
```

We get two entries in the cache that look the same but are not. Please ignore
the UTC timezone — my Linux machine has a different local timezone set.


## Solution

With this understanding, the solution to the bug was relatively simple. I just
needed to change the type I use for cache keys:

```
type DRTBase struct {
    DagId  dag.Id
    AtTime string // it used to be a time.Time
    TaskId string
}
```

and use serialized timestamp values in cache keys instead of `time.Time`.


## Summary

To sum it up, just be careful when using `time.Time` in Go map keys. I'm not
saying you should avoid it, but make sure to read the documentation for the
time standard package, especially the section on monotonic clocks and which
functions from that package can modify those values.


## References

1. [Go time package - Monotonic
   Clocks](https://pkg.go.dev/time#hdr-Monotonic_Clocks)
1. [Bug fix
   commit](https://github.com/ppacer/core/commit/5f71e08160072dd3237544a6aeb35265a3332d66)

