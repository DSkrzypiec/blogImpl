---
date: "2023-08-17"
tags: ["Go", "AST", "metaprogramming"]
title: "Getting mathod's source code in Go"
toc: false
draft: false
---


## Intro

Recently I thought I want to have a function, implemented in Go, which would return method's source code for given type
name and method name in the runtime. Something of this signature:

```
func MethodBodySource(typeName, methodName string) (*ast.File, string, error) {
    ...
}
```

This function would return found function body [AST](https://en.wikipedia.org/wiki/Abstract_syntax_tree), it's source
code as string and possibly an error.


In dynamically typed and interpreted languages this is a foundation functionality.
For example, in Python, it's enough to do the following:

```
import inspect

def func_source(f) -> str:
    return inspect.getsource(f)
```

In compiled languages this looks usually a bit more complicated and involves some kind of metaprogramming. I want to
have this function to detect whenever specific kind of methods in my project has been changed, to denote it in the
database (external persistent place for data really). I thought I would get the answer to my problem in an hour at
most using Stackoverflow, ChatGPT and Google. I was wrong. It took me a bit more. In the end the answer is not really
complicated but getting there took me few moments. Thus I thought it might be a good idea to summarize it in a blog
post.


## Metaprogramming in Go


## High level approach


##


## Summary



## References


