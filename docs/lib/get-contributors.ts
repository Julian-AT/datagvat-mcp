/**
 * Fetch GitHub contributors for a repository
 */

export interface Contributor {
  login: string;
  avatar_url: string;
  contributions: number;
}

/**
 * Fetches contributors for a GitHub repository
 *
 * @param owner - Repository owner
 * @param repo - Repository name
 * @returns Array of contributors sorted by contribution count
 */
export async function fetchContributors(
  owner: string,
  repo: string
): Promise<Contributor[]> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contributors`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
        },
        next: {
          revalidate: 3600, // Cache for 1 hour
        },
      }
    );

    if (!response.ok) {
      console.warn(`Failed to fetch contributors: ${response.statusText}`);
      return [];
    }

    const contributors = await response.json();
    return contributors.map((contributor: any) => ({
      login: contributor.login,
      avatar_url: contributor.avatar_url,
      contributions: contributor.contributions,
    }));
  } catch (error) {
    console.error('Error fetching contributors:', error);
    return [];
  }
}
