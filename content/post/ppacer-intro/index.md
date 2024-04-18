---
date: "2024-04-18"
tags: ["General", "Go"]
title: "Introducing ppacer: yet another DAG scheduler which I prefer"
toc: false
draft: false
---


## Intro

As I mentioned in [New Scheduler](https://dskrzypiec.dev/new-scheduler), in the
second half of 2023 I started working on implementing new scheduler in Go. In
this post I wanted to share with you the current status of the project, next
steps and few links.


## The name: ppacer

At the end of the previous year I was already working already for 4-5 months on
this project but still I didn't have a name for it. On my local disk it lived
in `gosched` catalog for those couple of months. It was to this point, that I
even setup a [goal for 2024](https://dskrzypiec.dev/year2023/#goals-for-2024),
to come up with a name for the project.

Around mid January 2024 I finally came up with the name - `ppacer`. The part
'pacer' comes from running. In marathons or other races a pacer is a runner who
helps to set the pace for other runners. The initial "p" comes from a word
"process". So it's a loose analogy to something that sets the pace for your
processes. At the same time it uses the same name convention as other famous
tool - [pprof](https://github.com/google/pprof), which I think sounds really
good.

There it is, I have the name! I was really happy. That enabled me to buy a
domain and create an organization on GitHub.


## Current status

At the moment `ppacer` is a set of Go libraries which can be used, to define
and build a DAG which would run on a schedule, a scheduler and an executor. All
those components can be compiled into single statically linked binary, or there
might be single scheduler program and multiple executors placed on separate
machines. Anyway, very basic version of the backend is ready. It doesn't yet
have MPV coverage regarding features, but it's good enough to be used in some
setups.

Currently I'm using ppacer to do backups of my
[Home Database](https://dskrzypiec.dev/home-app-go/) and refresh TLS
certificates for my applications.

There is no frontend yet at all. If you're fine with checking logs or DAG runs
information in SQLite or any other Go sql-compatible database, feel free to
play with it.


## ppacer links

There are few links you might be interested in, if this project sounds
interesting to you. There is [github.com/ppacer](https://github.com/ppacer)
organization on GitHub. There you can find

* Project with ppacer core Go libraries -
  [github.com/ppacer/core](https://github.com/ppacer/core)
* Repository with usage examples -
  [github.com/ppacer/examples](https://github.com/ppacer/examples)
* Repository with generic ppacer `Tasks` -
  [github.com/ppacer/tasks](https://github.com/ppacer/tasks)

Standard Go packages documentation (API reference) can be found in here:

* [pkg.go.dev/github.com/ppacer/core](https://pkg.go.dev/github.com/ppacer/core)

Last but not least, ppacer main page for high-level documentation, examples and
other information is here:

* [ppacer.org](https://ppacer.org)


## Documentation

As I mentioned ppacer backed is working for arbitrary minimal set of selected
features. I'd like to focus now on the frontend part, but before I do, I
decided to write down a bit of documentation. One part is Go libraries public
API documentation. That was mostly written during the development, so it needed
to be just polished a bit. The other part is documenting high-level design,
instructions on how to use ppacer, how to extend it, how to implement your own
schedules and so on.

There are few reasons why I want to do it. One is to show potential users or
interested developers how to even start and run "hello world" example. The
other reason is for me in the future, when I'll be back from frontend
development, to remember what I was thinking months ago and why I choose to
implement it this and not the other way. Another reason was a bit surprising.
Writing down documentation helped me a lot, to make libraries API better and
more consistent. Being a single developer on the project should already give a
lot of consistency but even in this case I saw small differences in naming or
conventions over the time. Writing it down in documentation helped me see it. I
wish I had done it earlier in the project.

A friend recommended me [Astro starlight](https://starlight.astro.build), to
build documentation web page. It's great! It's really easy to setup, it's
rather flexible and looks gorgeous in my opinion - lean, fast and modern.


## Next steps

The next steps for the project are as follows:

1. Finish writing documentation for existing backend
1. Start working on frontend PoC (probably HTMX + tmpl)
1. Design the logo
1. Write first version of ppacer frontend
1. Go back to add few more features on the backed
1. Prepare ppacer MVP version
1. ...
1. Profit?


## Summary

That's it for now. It's not really yet "introducing ppacer" it's rather
introducing the name and give you the current status, but hey I liked that
title. By the way the title of this post was inspired by Maxwell calling his
work on theory of electromagnetism "another theory of electricity which I
prefer". You can read about this very interesting story in [this
essay](https://www.damtp.cam.ac.uk/user/tong/em/dyson.pdf).

If you're interested in the project already, you can find the "hello world"
example in here: [ppacer.org/start/intro/](https://ppacer.org/start/intro/).


## References

1. [Why is Maxwell's Theory so hard to
   understand?](https://www.damtp.cam.ac.uk/user/tong/em/dyson.pdf)
