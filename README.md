# npm.trace
> measure the load time of npm modules and their dependencies.  Available at https://npmtrace.appspot.com.

[npm.trace](https://npmtrace.appspot.com) is a tool that makes it easy to understand the impact your npm dependencies have on the load time of your application.

![npm.trace](https://user-images.githubusercontent.com/534619/50564748-8e39c580-0cdc-11e9-93c5-4ee23bd26f94.png)

## How it's made
This uses [require-so-slow](https://github.com/ofrobots/require-so-slow) to do the profiling. It runs on Google Cloud, and under the hood uses:
- [Google App Engine](https://cloud.google.com/appengine/) for the frontend website
- [Google Cloud Functions](https://cloud.google.com/functions/) for API endpoints
- [Cloud Firestore](https://cloud.google.com/firestore/) for caching and storing data

## License
MIT

## Questions?
Feel free to reach out [@justinbeckwith](https://twitter.com/JustinBeckwith) or [file an issue](https://github.com/JustinBeckwith/npmtrace/issues)!
