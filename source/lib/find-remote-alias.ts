import parseGitUrl from 'git-url-parse';
import { GitCommandRunner } from './git-command-runner.js';

function isSameGitUrl(gitUrlA: string, gitUrlB: string): boolean {
    const parsedUrlA = parseGitUrl(gitUrlA);
    const parsedUrlB = parseGitUrl(gitUrlB);
    const pathA = parsedUrlA.pathname.replace(/\.git$/, '');
    const pathB = parsedUrlB.pathname.replace(/\.git$/, '');

    return parsedUrlA.resource === parsedUrlB.resource && pathA === pathB;
}

function getGitUrl(githubRepo: string): string {
    return `git://github.com/${githubRepo}.git`;
}

export interface FindRemoteAliasDependencies {
    readonly gitCommandRunner: GitCommandRunner;
}

export type FindRemoteAlias = (githubRepo: string) => Promise<string>;

export function findRemoteAliasFactory(dependencies: FindRemoteAliasDependencies): FindRemoteAlias {
    const { gitCommandRunner } = dependencies;

    return async function findRemoteAlias(githubRepo: string) {
        const gitRemote = getGitUrl(githubRepo);

        const remotes = await gitCommandRunner.getRemoteAliases();
        const matchedRemote = remotes.find((remote) => {
            return remote.url && isSameGitUrl(gitRemote, remote.url);
        });

        if (!matchedRemote) {
            throw new Error(`This local git repository doesn’t have a remote pointing to ${gitRemote}`);
        }

        return matchedRemote.alias;
    };
}
