# npm.trace
> measure the load time of npm modules and their dependencies.  Available at https://npmtrace.appspot.com.

[npm.trace](https://npmtrace.appspot.com) is a tool that makes it easy to understand the impact your npm dependencies have on the load time of your application.

## How it's made
This uses [require-so-slow](https://github.com/ofrobots/require-so-slow) to do the profiling.  The app is run on [Google App Engine](https://cloud.google.com/appengine/), and uses [Cloud Firestore](https://cloud.google.com/firestore/) and [Cloud Storage](https://cloud.google.com/storage/) under the hood.

## License
MIT

## Questions?
Feel free to reach out [@justinbeckwith](https://twitter.com/JustinBeckwith) or [file an issue](https://github.com/JustinBeckwith/npmtrace/issues)!
