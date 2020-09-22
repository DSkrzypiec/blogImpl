---
date: "2020-09-22"
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

On next two parts we'll focus on implementing `DirReader` interface for actual
OS file system using cross-platform [os package](https://golang.org/pkg/os/)
and for mocked in-memory Go objects. This pattern, having an interface
depending on interface rather then concrete type, is very broadly used despite
particular programming language. I believe it originated in Simula with virtual
functions and was later adopted by Bjarne Stroustrup in C++ in early 1980s. In
C++ we could define abstract base class with methods similar to `DirReader`.


## Actual implementation

## Mock

## Appendix

Source code of `Scan` function:

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

## References

1. [Afero](https://github.com/spf13/afero)
2. [Go 'os' package](https://golang.org/pkg/os/)

