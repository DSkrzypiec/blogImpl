---
date: "2020-09-29"
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

## Interface

I have not stated `Scan` function arguments yet. I'd like to use this function
both on actual *FS* and also on mocked *FS*, so what should be an argument for
that function? Yep, an interface. We should define minimal interface which
would let us write recursive algorithm for scanning file tree.

For given directory this interface should have functionalities to give us a
list of files and sub directories, path of current location and something to
reproduce or move itself for sub catalogs.

```
type DirReader interface {
    DirPath() string
    Readdir() ([]os.FileInfo, error)
    New(string) DirReader
}
```

The `DirReader` interface is my proposition to meet those requirements. It's
composed of three methods - `DirPath` returns current location, `Readdir`
reads content of current catalog and `New` produce another `DirReader`
(assumable) for sub catalogs. Furthermore let's also note that type `os.FileInfo`
from the standard library is an interface. Details can be found
[here](https://golang.org/pkg/os/#FileInfo).


Now we can finally pronounce signature of `Scan` function

```
func Scan(reader DirReader) (Dir, error) {
    ...
}
```

At this point we could even provide a full implementation of `Scan` function
using only `DirReader` interface definition. I'll leave this implementation in
the Appendix to not distract us from main goal which is mocking a *FS*.

In the next two sections we'll focus on implementing `DirReader` interface for actual
OS file system using cross-platform [os package](https://golang.org/pkg/os/)
and for mocked in-memory Go objects. This pattern, having an interface
depending on interface rather then concrete type, is very broadly used despite
particular programming language. I believe it originated in Simula with virtual
functions and was later adopted by Bjarne Stroustrup in C++ in early 1980s. In
C++ we could define abstract base class with methods similar to `DirReader`.


## Actual implementation

The actual implementation of `DirReader` which would use an actual OS file system
is rather straightforward. Let's start from defining a new type which will
represent single (non-recursive) directory - `FlatDir`.

```
type FlatDir struct {
    Path string
}
```

To satisfy `DirReader` interface we've got to implement required methods.
Getting directory's path and create a new `FlatDir` are trivial methods in this
case:

```
func (fd FlatDir) DirPath() string {
    return fd.Path
}

func (fd FlatDir) New(path string) DirReader {
    return FlatDir{Path: path}
}
```

All of the work is done in `Readdir` method. We'll use functionalities from Go
`os` package to implement reading content of OS file system directory.

```
func (fd FlatDir) Readdir() ([]os.FileInfo, error) {
    currentDir, err := os.Open(fd.Path)
    if err != nil {
        return nil, err
    }

    fileInfos, err := currentDir.Readdir(-1)
    if err != nil {
        return nil, err
    }

    return fileInfos, nil
}
```

That method is really just a wrapper on
[Readdir](https://golang.org/pkg/os/#File.Readdir) method which is
cross-platform and do the heavy lifting for us.

After that type `FlatDir` satisfies `DirReader` interface. Now, in order to
scan file tree for given root path, we could run `tree, err := Scan(FlatDir{path})`.


## Mock

In order to prepare mock for a file system we have to define an object which
behaves like a file system and at the same time satifies `DirReader` interface.
As I stated at the beggining `Dir` is natural representation of a file system
for me. Because of that my mock object will be very close to `Dir`:

```
type MockDir struct {
    Path    string
    Files   []os.FileInfo
    SubDirs map[string]*MockDir
}
```

Defined `MockDir` represents our mock *FS*. Using `map[string]*MockDir`
instead of `map[string]MockDir` is just for my convenience while building mock
trees. In the first version I can in fact modify sub trees of defined tree.

To satifsy `DirReader` interface we, once again, have to provide implemnetation
of methods `DirPath`, `Readdir` and `New`. The first one in this case also just
returns `MockDir.Path`. Method `Readdir` returns all files from `MockDir.Files`
and based on `SubDirs` keys - sub catalog names also list of catalogs as
`[]os.FileInfo`. Method `New` is a bit tricky in context of the
mock object. This method suppose to return a new `DirReader` for a given path.
In this case we can do that only for sub catalogs of current tree, becuase
there isn't any other valid path outside sub trees. Implementation of those
three methods can be found in the Appendix.

Up to this point we have function `Scan` which scans a file tree based on
`DirReader` interface. We've got implementation of `DirReader` for actual OS
file system and also implementation of mock `DirReader`. Hence we can use both
`FlatDir` and `MockDir` in `Scan` function.

One last pice left is convenient building `MockDir` object for unit testing.


## Appendix

### Source code of `Scan` function:

```
func Scan(reader DirReader) (Dir, error) {
    fileInfos, err := reader.Readdir()
    if err != nil {
        return Dir{}, err
    }
    dir := New(reader.DirPath(), 100) // Produces a new empty Dir

    for _, fileInfo := range fileInfos {
        name := fileInfo.Name()
        if !fileInfo.IsDir() {
            dir.Files = append(dir.Files, fileInfo)
            continue
        }

        newPath := filepath.Join(reader.DirPath(), name)
        newReader := reader.New(newPath)
        subDir, err := Scan(newReader)
        if err != nil {
            return Dir{}, err
        }
        dir.SubDirs[name] = subDir
    }
    return dir, nil
}

```

### `MockDir` methods

```
func (md MockDir) DirPath() string {
    return md.Path
}

func (md MockDir) Readdir() ([]os.FileInfo, error) {
    files := make([]os.FileInfo, 0, 10)

    for _, file := range md.Files {
        files = append(files, file)
    }

    for dirName := range md.SubDirs {
        files = append(files, NewMockFileInfo(dirName, true))
    }

    return files, nil
}

func (md MockDir) New(path string) DirReader {
    for _, dir := range md.SubDirs {
        if dir.Path == path {
            return dir
        }
    }

    emptyDirs := make(map[string]*MockDir)
    return MockDir{path, make([]os.FileInfo, 0), emptyDirs}
}
```

## References

1. [Afero](https://github.com/spf13/afero)
2. [Go 'os' package](https://golang.org/pkg/os/)

