workflow "Test, build, and publish" {
  on = "push"
  resolves = ["test", "lint", "publish"]
}

action "npm install" {
  uses = "actions/npm@master"
  args = "install"
}

action "test" {
  uses = "actions/npm@master"
  args = "run test-ci"
  needs = ["npm install"]
}

action "lint" {
  uses = "actions/npm@master"
  args = "run lint"
  needs = ["npm install"]
}

# Filter for a new tag
action "version tag" {
  uses = "actions/bin/filter@master"
  args = "tag v*"
}

action "publish" {
  uses = "actions/npm@master"
  secrets = ["NPM_AUTH_TOKEN"]
  args = "publish --access public --unsafe-perm"
  needs = ["version tag", "test", "lint"]
}
