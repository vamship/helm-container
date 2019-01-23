# helm-container

Project that can be used to build a simple container that provides kubectl and
helm.

## Building

In order to use the tooling provided with the project, node dependencies must
first be installed by running:

```
npm install
```

Once dependencies have been installed, the container can be built using the
grunt task:

```sh
grunt package
```

This will automatically build the container and tag it with the package version
from package.json.

## Publishing

After buiding, the container can be pushed to ADIs docker registry if necessary.
Ensure that credentials to access AWS ECS have been initialized by running:

```sh
# Note the back quotes in the command.
`aws ecr get-login --no-include-email --region us-east-1 --profile my-profile`
```

The above command obtains a login command from AWS, and executes it in the
shell, setting up credentials to access ADI's docker registry.

The docker container can now be published to ADI's registry by executing:

```sh
grunt publish
```
