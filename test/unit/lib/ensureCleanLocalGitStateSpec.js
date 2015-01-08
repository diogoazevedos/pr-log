'use strict';

var chai = require('chai'),
    sinon = require('sinon'),
    proxyquire = require('proxyquire'),
    expect = chai.expect;

chai.use(require('sinon-chai'));
chai.use(require('chai-as-promised'));
require('sinon-as-promised');

describe('ensureCleanLocalGitState', function () {
    var git = sinon.stub().resolves(),
        findRemoteAlias = sinon.stub(),
        gitStatus,
        gitRevParse,
        gitRevList,
        requireStubs = {
            'git-promise': git,
            './findRemoteAlias': findRemoteAlias
        },
        ensureCleanLocalGitState = proxyquire('../../../lib/ensureCleanLocalGitState', requireStubs),
        githubRepo = 'foo/bar',
        remoteAlias = 'origin';

    beforeEach(function () {
        gitStatus = git.withArgs('status -s').resolves('');
        gitRevParse = git.withArgs('rev-parse --abbrev-ref HEAD').resolves('master');
        gitRevList = git.withArgs('rev-list --left-right master...origin/master').resolves('');
        findRemoteAlias.resolves(remoteAlias);
    });

    afterEach(function () {
        git.reset();
        findRemoteAlias.reset();
    });

    it('should reject if `git status -s` is not empty', function () {
        gitStatus.resolves('M foobar\n');

        return expect(ensureCleanLocalGitState(githubRepo))
            .to.be.rejectedWith('Local copy is not clean');
    });

    it('should reject if current branch is not master', function () {
        gitRevParse.resolves('feature-foo\n');

        return expect(ensureCleanLocalGitState(githubRepo))
            .to.be.rejectedWith('Not on master branch');
    });

    it('should reject if the local branch is ahead of the remote', function () {
        gitRevList.resolves('<commit-sha1\n');

        return expect(ensureCleanLocalGitState(githubRepo))
            .to.be.rejectedWith('Local git master branch is 1 commits ahead and 0 commits behind of origin/master');
    });

    it('should reject if the local branch is behind the remote', function () {
        gitRevList.resolves('>commit-sha1\n');

        return expect(ensureCleanLocalGitState(githubRepo))
            .to.be.rejectedWith('Local git master branch is 0 commits ahead and 1 commits behind of origin/master');
    });

    it('should fetch the remote repository', function () {
        return ensureCleanLocalGitState(githubRepo)
            .then(function () {
                expect(git).to.have.been.calledWithExactly('fetch origin');
            });
    });

    it('should fulfill if the local git state is clean', function () {
        return expect(ensureCleanLocalGitState(githubRepo))
            .to.be.fulfilled;
    });
});
