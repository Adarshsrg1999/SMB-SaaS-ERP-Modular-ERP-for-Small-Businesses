const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Configuration
const REQUIRED_DOCS = ['SMB SaaS ERP.md'];
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

console.log(`${YELLOW}⚡ Starting Pre-Commit Validation...${RESET}`);

// 1. Run Lint (if available) - checking client/server independently just in case
// For simplicity, using the root 'lint' script which triggers both
try {
    console.log(`${YELLOW}🔍 Running Lint Checks...${RESET}`);
    execSync('npm run lint', { stdio: 'inherit' });
    console.log(`${GREEN}✅ Lint Checks Passed${RESET}`);
} catch (error) {
    console.error(`${RED}❌ Lint Checks Failed. Please fix errors before committing.${RESET}`);
    process.exit(1);
}

// 2. Run Tests
try {
    console.log(`${YELLOW}🧪 Running Tests (Client & Server)...${RESET}`);
    // Running tests in parallel or slightly optimized if possible, but serial is safer for output
    // Using root test script
    execSync('npm run test', { stdio: 'inherit' });
    console.log(`${GREEN}✅ Tests Passed${RESET}`);
} catch (error) {
    console.error(`${RED}❌ Test Failed. Please fix tests before committing.${RESET}`);
    process.exit(1);
}

// 3. Check for Markdown Updates
try {
    const stagedFiles = execSync('git diff --cached --name-only').toString().split('\n');

    // Check if any .md file is staged
    const mdFileStaged = stagedFiles.some(file => file.endsWith('.md'));

    // Specifically check for critical docs if they are "out of date" compared to code changes?
    // The requirement is: "check .md files are update incluing SMB SaaS ERP.md"
    // "if .md files ar not update ask user weather contniu"
    // This implies: If I'm committing CODE, I should probably also be committing DOCS.

    // Let's assume: If there are code changes (js, jsx, css) but NO markdown changes, warn user.
    const codeFilesStaged = stagedFiles.some(file => file.match(/\.(js|jsx|css|html)$/));

    if (codeFilesStaged && !mdFileStaged) {
        console.log(`${YELLOW}⚠️  Code changes detected but no Markdown documentation update found.${RESET}`);
        console.log(`${YELLOW}   Ideally, "SMB SaaS ERP.md" or other docs should be updated.${RESET}`);

        // Interactive Prompt
        // Note: In a pre-commit hook, stdin is often closed. We need to open /dev/tty on Unix or CON on Windows?
        // Node's readline usually works if we attach to process.stdout/stdin but for git hooks it's tricky.
        // A common workaround is using child_process to read from the TTY directly or just warning.

        // However, standard readline might fail effectively inside a hook without TTY hacks.
        // Let's try simple readline first, but if it hangs, we might need a specific TTY check.
        // For Windows git bash, /dev/tty might work. For cmd, it might be different.

        // PROMPT STRATEGY:
        // Attempt to open TTY.
        let ttyPath = process.platform === 'win32' ? 'CON' : '/dev/tty';

        try {
            const fs = require('fs');
            const fd = fs.openSync(ttyPath, 'r+');
            const ttyReadStream = fs.createReadStream(null, { fd });
            const ttyWriteStream = fs.createWriteStream(null, { fd });

            const rl = readline.createInterface({
                input: ttyReadStream,
                output: ttyWriteStream
            });

            rl.question(`${YELLOW}❓ Do you want to continue without updating docs? (y/n): ${RESET}`, (answer) => {
                rl.close();
                if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
                    console.log(`${GREEN}⏩ Continuing commit...${RESET}`);
                    process.exit(0);
                } else {
                    console.log(`${RED}🛑 Commit aborted by user.${RESET}`);
                    process.exit(1);
                }
            });
        } catch (err) {
            console.log(`${YELLOW}⚠️  Could not open TTY for interactive prompt. Assuming non-interactive mode.${RESET}`);
            console.log(`${YELLOW}   Proceeding with commit, but please verify docs later.${RESET}`);
            process.exit(0);
        }

        // Keep process alive for input
        // Since readline is async, we shouldn't exit yet.
        // But we need to handle the case where we can't open TTY (logic in catch above handles exit)
    } else {
        process.exit(0);
    }
} catch (error) {
    console.error(`${RED}❌ Error during validation script: ${error.message}${RESET}`);
    process.exit(1);
}
