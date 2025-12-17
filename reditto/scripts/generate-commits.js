const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const OUTPUT_FILE = 'COMMITS.md';
const GIT_LOG_FORMAT = '--pretty=format:%H|%an|%ae|%ad|%s';
const DATE_FORMAT = '--date=format:%Y-%m-%d %H:%M:%S';

console.log('📝 Generating commit history...\n');

try {
  // Check if git repository exists
  try {
    execSync('git rev-parse --git-dir', { encoding: 'utf-8', stdio: 'pipe' });
  } catch (error) {
    console.error('❌ Error: Not a git repository');
    process.exit(1);
  }

  // Get git log (Windows PowerShell requires different quoting)
  const gitCommand = process.platform === 'win32'
    ? 'git log "--pretty=format:%H|%an|%ae|%ad|%s" "--date=format:%Y-%m-%d %H:%M:%S" --all'
    : `git log ${GIT_LOG_FORMAT} ${DATE_FORMAT} --all`;
  
  const gitLog = execSync(gitCommand, { encoding: 'utf-8' }).trim();

  if (!gitLog) {
    console.log('⚠️  No commits found in repository');
    process.exit(0);
  }

  // Parse commits
  const commits = gitLog.split('\n').map(line => {
    const [hash, author, email, date, message] = line.split('|');
    return { hash, author, email, date, message };
  });

  // Group commits by date
  const commitsByDate = commits.reduce((acc, commit) => {
    const dateOnly = commit.date.split(' ')[0];
    if (!acc[dateOnly]) {
      acc[dateOnly] = [];
    }
    acc[dateOnly].push(commit);
    return acc;
  }, {});

  // Generate markdown content
  let markdown = '# Commit History\n\n';
  markdown += `> Auto-generated on ${new Date().toLocaleString()}\n`;
  markdown += `> Total commits: ${commits.length}\n\n`;
  markdown += '---\n\n';

  // Add table of contents
  markdown += '## Table of Contents\n\n';
  Object.keys(commitsByDate).sort().reverse().forEach(date => {
    const count = commitsByDate[date].length;
    markdown += `- [${date}](#${date.replace(/-/g, '')}) (${count} commit${count > 1 ? 's' : ''})\n`;
  });
  markdown += '\n---\n\n';

  // Add commits grouped by date
  Object.keys(commitsByDate).sort().reverse().forEach(date => {
    const dateCommits = commitsByDate[date];
    markdown += `## ${date}\n\n`;
    markdown += `*${dateCommits.length} commit${dateCommits.length > 1 ? 's' : ''}*\n\n`;

    dateCommits.forEach(commit => {
      markdown += `### 📌 ${commit.message}\n\n`;
      markdown += `- **Hash**: \`${commit.hash.substring(0, 7)}\`\n`;
      markdown += `- **Author**: ${commit.author} <${commit.email}>\n`;
      markdown += `- **Date**: ${commit.date}\n`;
      
      // Try to get files changed
      try {
        const filesChanged = execSync(
          `git diff-tree --no-commit-id --name-only -r ${commit.hash}`,
          { encoding: 'utf-8' }
        ).trim().split('\n').filter(Boolean);
        
        if (filesChanged.length > 0) {
          markdown += `- **Files Changed**: ${filesChanged.length}\n`;
          markdown += '\n<details>\n<summary>View changed files</summary>\n\n';
          filesChanged.forEach(file => {
            markdown += `  - \`${file}\`\n`;
          });
          markdown += '\n</details>\n';
        }
      } catch (error) {
        // Ignore if unable to get files changed
      }
      
      markdown += '\n---\n\n';
    });
  });

  // Add statistics section
  markdown += '## Statistics\n\n';
  
  // Count commits per author
  const authorStats = commits.reduce((acc, commit) => {
    acc[commit.author] = (acc[commit.author] || 0) + 1;
    return acc;
  }, {});

  markdown += '### Commits by Author\n\n';
  markdown += '| Author | Commits | Percentage |\n';
  markdown += '|--------|---------|------------|\n';
  Object.entries(authorStats)
    .sort((a, b) => b[1] - a[1])
    .forEach(([author, count]) => {
      const percentage = ((count / commits.length) * 100).toFixed(1);
      markdown += `| ${author} | ${count} | ${percentage}% |\n`;
    });

  markdown += '\n### Timeline\n\n';
  markdown += '| Date | Commits |\n';
  markdown += '|------|--------|\n';
  Object.keys(commitsByDate).sort().reverse().forEach(date => {
    markdown += `| ${date} | ${commitsByDate[date].length} |\n`;
  });

  markdown += '\n---\n\n';
  markdown += '*This file is auto-generated. Do not edit manually.*\n';
  markdown += '*Run `npm run git-history` to regenerate.*\n';

  // Write to file
  const outputPath = path.join(process.cwd(), OUTPUT_FILE);
  fs.writeFileSync(outputPath, markdown, 'utf-8');

  console.log(`✅ Successfully generated ${OUTPUT_FILE}`);
  console.log(`📊 Total commits: ${commits.length}`);
  console.log(`👥 Contributors: ${Object.keys(authorStats).length}`);
  console.log(`📅 Date range: ${Object.keys(commitsByDate).sort()[0]} to ${Object.keys(commitsByDate).sort().reverse()[0]}`);
  console.log(`\n📄 File saved to: ${outputPath}\n`);

} catch (error) {
  console.error('❌ Error generating commit history:', error.message);
  process.exit(1);
}
