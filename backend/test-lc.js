

const query = `
query getContestHistory($username: String!) {
  userContestRankingHistory(username: $username) {
    attended
    rating
    contest {
      title
      startTime
    }
  }
  matchedUser(username: $username) {
    tagProblemCounts {
      advanced { tagName problemsSolved }
      intermediate { tagName problemsSolved }
      fundamental { tagName problemsSolved }
    }
  }
}
`;

fetch('https://leetcode.com/graphql', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Referer': 'https://leetcode.com' },
  body: JSON.stringify({ query, variables: { username: 'abhishek1440' } })
}).then(r=>r.json()).then(j => console.log(JSON.stringify(j).substring(0, 500))).catch(console.error);
