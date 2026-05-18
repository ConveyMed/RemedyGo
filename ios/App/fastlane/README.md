fastlane documentation
----

# Installation

Make sure you have the latest version of the Xcode command line tools installed:

```sh
xcode-select --install
```

For _fastlane_ installation instructions, see [Installing _fastlane_](https://docs.fastlane.tools/#installing-fastlane)

# Available Actions

## iOS

### ios status

```sh
[bundle exec] fastlane ios status
```

Show latest TestFlight build number

### ios build

```sh
[bundle exec] fastlane ios build
```

Web build + Capacitor sync + Xcode archive + export signed IPA

### ios archive_only

```sh
[bundle exec] fastlane ios archive_only
```

Xcode archive + export signed IPA only (assumes web build + cap sync already done)

### ios upload

```sh
[bundle exec] fastlane ios upload
```

Upload the latest IPA to App Store Connect / TestFlight

### ios testflight_only

```sh
[bundle exec] fastlane ios testflight_only
```

Archive + upload to TestFlight only (no App Store submit). Use for pre-release testing.

### ios submit

```sh
[bundle exec] fastlane ios submit
```

Submit current processed build for App Store review.

### ios release

```sh
[bundle exec] fastlane ios release
```

Full release: build -> upload -> submit

### ios release_prebuilt

```sh
[bundle exec] fastlane ios release_prebuilt
```

Release assuming web build + cap sync already done manually

----

This README.md is auto-generated and will be re-generated every time [_fastlane_](https://fastlane.tools) is run.

More information about _fastlane_ can be found on [fastlane.tools](https://fastlane.tools).

The documentation of _fastlane_ can be found on [docs.fastlane.tools](https://docs.fastlane.tools).
