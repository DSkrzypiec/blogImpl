---
date: "2020-09-20"
tags: ["Go"]
title: "Mocking a file system in Go"
toc: false
draft: true
---

{{< fileTree >}}
* src
    * config
        * config.go
        * config_test.go
        * reloader.go
    * dir
        * dir.go
        * dir_test.go
        * dirCompare.go
        * dirCompare_test.go
        * hash.go
        * listener.go
    * loop
        * mainLoop.go
    * main.go
* readme.md
{{< /fileTree >}}


## Intro

In this post we'll try to mock some features of a file system in Go. We'll
focus mainly on file tree structure instead on IO operations on files itself.
If you are interested in full abstract file system for Go check out
[afero](https://github.com/spf13/afero) package.

If your application uses a file system (*FS*) a bit beyond just reading a single file
then you should probably want to mock a *FS* in order to test it. Without
mocking it only way to write unit tests is to actually create files, performs
tests and clean up afterwards. It's slow (reaching to hard drive) and
ineffective.

Let's say we want to implement reading a file tree structure. For me natural
representation of such a tree is the following:

```
type Dir struct {
    Path    string,
    Files   []os.FileInfo,
    SubDirs map[string]Dir
}
```

Structure `Dir` have a `Path` path to root catalog, `Files` which is a list of meta
information of files and a dictionary which maps a sub catalog name into actual
sub catalog - another `Dir`. Which gives us recursive tree-like structure
representing a file tree. I called it "natural" representation because it's
usually the case shown in file explorers. Current catalog with files and other
sub catalogs. Another representation could be just an array of `os.FileInfo`
extended by full path but it less natural for most people. It's more natural
for computers though.

Now I'd like to have some functionality which scans actual OS file system to
provide `Dir` representation. On other hand I want to prepare mock *FS* in
order to test that functionality without manual manipulation of actual *FS*.

```
func Scan(...) (Dir, error) {
    ...
}
```

## Mock



## References

1. [Afero](https://github.com/spf13/afero)

