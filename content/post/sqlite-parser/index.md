---
date: "2022-10-23"
tags: ["Database", "SQL", "Scala"]
title: "Implementing SQLite parser in Scala"
toc: false
draft: false
---

![img](sqliteExprTree.png)


## Intro

About a year ago I've played a bit with [parsing T-SQL](https://dskrzypiec.dev/parsing-tsql). At the time I've used
Microsoft library and ANTLR for generating lexer and parser based on predefined T-SQL grammar. Recently I've come back
to this topic. I've implemented [SQLite](https://www.sqlite.org/index.html) parser almost from scratch (without code
generation).


## ..., but why?

In general I wanted to have a SQL parser in order to build some kind of static analyzer tool for SQL and databases. One
might ask why I just haven't taken source code from Postgres parser or SQLite? There are few reasons

* I didn't want C (or C++) for this particular side project at the time
* I wanted to try to unify more then one SQL dialect into single project
* Going through the full parser source code would require a bit too much work for a side project

Another question might be why haven't I used [ANTLR](https://dskrzypiec.dev/parsing-tsql) or another tool for
automatically generate parser source code based on grammar definition. The main reason was that I didn't really like
structure of the parse tree and emphasis for visitor pattern. Also I wouldn't easily work to combine few SQL dialects
other than defining those separately.

I once tried to implement a parser from scratch in Go. It was probably the best approach, but it was still a bit too
much hassle for a side project to implement most of SQL grammar. But recently, while I was learning Scala, I "trafiłem
na" [fastparse](https://TODO.crap) library.


## *fastparse* library

The fastparse library is an implementation of [parser combinators](https://todo.com) functional approach of writing
parsers.


