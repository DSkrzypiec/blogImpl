---
date: "2021-11-13"
tags: ["Database", "T-SQL", "C#"]
title: "Parsing T-SQL"
toc: false
draft: false
---

![img](introPic.png)

## Intro

Once I've tried to implement auto formatter for T-SQL. To make this there seems to
be two ways. The first and easier one is to implement sets of rules to
transform text file without any context. The other one is to base on
[AST](https://en.wikipedia.org/wiki/Abstract_syntax_tree) of T-SQL and use its
context to apply formatting. The first case seems to be easier at the beginning
and can be gradually extended but it's really hard and dirty to include all of
the cases without the knowledge of the context. So I thought the right way is
to use abstract syntax tree.


## Implementing a parser

Roughly about two years ago I couldn't find a library containing lexer and
parser for T-SQL so I've chosen to write my own parser of T-SQL. By the way, I
haven't really write a parser ever before so I treated it as a nice opportunity
to learn.

The whole idea of creating code auto formatter came from Go language with such
a tool. Obviously I looked into implementation of [Go's
parser](https://github.com/golang/go/blob/master/src/go/parser/parser.go).

I very liked this implementation, clean and simple. In similar way I've
implemented a lexer (scanner) and started to implement a parser.
I've wrapped around implementation of core mechanism but I didn't have enough
motivation and time to implement fully-fledge parser for T-SQL. It stalled and
I have leave the project behind.


## Oh, there is a library


## ANTLR


## Summary


## References

1. [github.com/DSkrzypiec/mssfmt](https://github.com/DSkrzypiec/mssfmt)

