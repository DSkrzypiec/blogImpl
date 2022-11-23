---
date: "2022-11-23"
tags: ["database", "Go"]
title: "Home App v2 - rewritten in Go"
toc: false
draft: false
---

![img](homeApp.png)

## Intro

Two years ago I've introduced [Home Database](https://dskrzypiec.dev/home-db)
with corresponding Home App written in ASP.NET Core MVC (C#). The original idea
was to have a database for keeping very personal documents and other data
related to me, my home and my family. More about motivations can be found
in the linked post about Home Database.

In case if you want to explore dev version of Home App before reading this
post, you can visit

* [https://homeappdev.dskrzypiec.dev](https://homeappdev.dskrzypiec.dev)
* and use credentials `testuser/password`

Or you can compile it from [source code](https://github.com/dskrzypiec/homeAppGo) and run locally.

## Why v2?

Regarding original version written in C# I haven't made a single commit since
mid-June 2021. It's hard to describe why exactly. I was thinking about
developing new features but I didn't want to continuing doing so in ASP.NET.
Perhaps it wasn't fun anymore? I'm not sure. Nevertheless recently I though it
would be better if I rewrite this app in Go. Firstly, because I was convinced
that in this framework I would want to continue developing the app. One might
ask why suddenly I've changed my mind, because I considered Go in 2020 and I
didn't go for it. There are three reasons

1. Now there is a [Go driver for SQLite](https://pkg.go.dev/modernc.org/sqlite)
   without using *cgo*
1. I've tested that using [html/template
   package](https://pkg.go.dev/html/template) with basic CSS might get pretty
   good UI
1. Moving Home App online

In 2020 the first two points were not met, therefore I choose C# over Go.
Regarding moving online. In the first version Home App was hosted on my RPi
within Tailscale network, so only handful of devices could access the
application. It was fine for me, but for other users (my wife) it was rather
poor UX.


## Migration to Go

### MVC

Regarding high level design in both C# and Go versions I've implemented
[MVC](https://en.wikipedia.org/wiki/Model–view–controller) approach. It's
suitable because of two things. The first one is that I don't do much frontend and
the other one is fact that Home App is, and probably will be, rather straightforward
application regarding UI and UX.

In Go I've used standard `html/template` package for generating HTML templates
and then rendering those using populated models. This package supports
including other templates, conditional expressions, using variables and looping
over collections. That's definitely enough for my needs. One of Home App pages
is generated using the following HTML template:

```
<!DOCTYPE html>
<html>
<head>
    {{ template "common-header" }}
    <style>
        {{ template "common-css" }}
    </style>
</head>

<body>
    {{ template "common-logo" }}
    {{ template "common-menu" }}
    <h1>Finance</h1>

    <table>
        <thead>
            ...
        </thead>
        <tbody>
        {{ range .MonthlyAggregation }}
            <tr>
                <td>{{.YearMonth}}</td>
                <td>{{.NumOfTransactions}}</td>
                <td>{{.Inflow}}</td>
                <td>{{.Outflow}}</td>
            </tr>
        {{ end }}
        </tbody>
    </table>
</body>
</html>
```

It's concise and simple. There are some other templates included for common
components and in the body we have a table generated based on
`MonthlyAggregation` object which is prepared in corresponding controller.

In case if you're interested in reading more details:

* All Home App HTML templates are defined [here](https://github.com/DSkrzypiec/homeAppGo/tree/main/html)
* All Home App controllers are defined within `homeApp/controller` package
  [here](https://github.com/DSkrzypiec/homeAppGo/tree/main/controller)


### SQLite and new driver

In May 2022 I found out that there is a [SQLite Go
driver](https://gitlab.com/cznic/sqlite) which doesn't require C and *cgo* to
compile. This package was done by automatic translation from C to Go. I think
it's impressive! As expected this translation should be slower then actual
hand-written C code, but [this
benchmark](https://datastation.multiprocess.io/blog/2022-05-12-sqlite-in-go-with-and-without-cgo.html)
shows it's not that bad. Regarding Home App use-case that will be sufficient.
Usually I'm not a fan of moving cost from compile-time to run-time but in this
particular case keeping development process as smooth as possible is more
important, than a bit slower `INSERT`s.


### HTTP backend

Most of backend code in Home App is related to accessing Home Database within
HTTP handler and read or insert data. So almost everything touches networking
layer in some sense. For now there was only one component which was separated
and needed actual migration between projects. It's parsing PKO Bank XML dump
file with transactions. This parser was rather small peace. I've migrated it
using standard `encoding/xml` Go package in single evening (including unit
tests).

In general I feel that `net/http` library is a bit more pleasant to use
comparing to ASP.NET. I feel that Go `net/http` is a bit lower level of
abstraction then ASP.NET and I prefer it this way. Although I might be a bit
biased, because I've spent more time in the past in networking in Go, than in
C#.


### Full text search on documents

It's not directly related to Go but I've planned to do this for a long time and
`v2` was the best opportunity to do it. SQLite provides full text search
capability via [FTS5 extension](https://www.sqlite.org/fts5.html). Using it in
SQLite is as easy as creating a corresponding virtual table

```
CREATE VIRTUAL TABLE IF NOT EXISTS documentsFts5 USING fts5(
    DocumentId,
    DocumentName,
    UploadDate,
    DocumentDate,
    Category,
    PersonInvolved,
    FileExtension
);

```

As you can see for now full text search is performed over documents metadata
(title, dates, category, person, etc.) and not its content but still it's good
enough (for now) to browse documents.

The only cost of *FTS* is keeping documents metadata duplicated, but in my
opinion it's rather small cost for convenient google-like searching integrated
in a half an hour.


## Going online


## Security


## Summary


## References

1. [Termux](https://termux.com/)
2. [Hugo](https://gohugo.io/)
