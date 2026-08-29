
I want you to add a continuous version control and restore system to this interactive HTML training project.
The goal is simple:
Every meaningful change should be recoverable quickly if something goes wrong.
I want to be able to experiment freely, make visual edits, change game logic, adjust assets, and use the visual Edit Mode without worrying that a mistake will permanently damage the project.
This version control system should work alongside the visual Edit Mode and the rest of the existing project without interfering with normal development.
PRIMARY REQUIREMENT
Before making any meaningful project change, create a recoverable version snapshot.
Examples of meaningful changes include:

• editing HTML.
• editing CSS.
• editing JavaScript.
• moving or resizing assets.
• changing buttons.
• changing gameplay logic.
• changing quiz logic.
• changing SCORM functionality.
• adding or deleting files.
• changing images or video references.
• changing transitions.
• changing animation logic.
• saving changes from Edit Mode.
• restructuring a screen.
• modifying interactive elements.
The system should make it very easy to return to an earlier working state.

1. USE GIT AS THE PRIMARY VERSION HISTORY
If this project is not already a Git repository, initialize Git for the project.
Do not replace an existing Git repository if one already exists.
Use Git as the canonical long-term version history.
Make sure important project files are tracked.
Do not commit unnecessary development junk such as:

• temporary files.
• operating system metadata.
• cache directories.
• generated logs.
• editor temporary files.
• dependency folders that should normally be ignored.
Create or update .gitignore appropriately without ignoring important project assets.

2. CREATE AUTOMATIC SAFETY SNAPSHOTS
Before you perform a meaningful modification, create a safety snapshot of the current working state.
Use concise automatic commit messages such as:
autosave: before edit mode changes
autosave: before callback lab update
autosave: before layout adjustment
autosave: before gameplay logic change
The purpose is not perfect Git hygiene.
The purpose is:
I should almost always have a recent working state I can return to.
Do not create commits for completely trivial read-only actions.

3. SAVE FROM EDIT MODE SHOULD CREATE A VERSION
Whenever I click SAVE inside the visual Edit Mode:

1. Write the approved visual changes into the actual project source..
2. Verify the write succeeded..
3. Create a version control snapshot immediately afterward..
Use a message similar to:
visual-save: [screen or edited element]
For example:
visual-save: supplier email screen
or:
visual-save: lab 2 video and continue button
This means every successful visual save becomes a recoverable checkpoint.

4. NAMED CHECKPOINTS
Give me a simple way to create a named checkpoint before larger experiments.
Examples:
checkpoint: working credential phishing lab
checkpoint: before redesigning lab 2
checkpoint: stable SCORM build
checkpoint: before animation experiment
If I say something like:
Create a checkpoint called "working version before redesign"
create that checkpoint immediately.
Named checkpoints should be easy to find later.

5. FAST REVERT COMMANDS
When I tell you something like:

• "undo the last change".
• "go back one version".
• "revert the last Codex change".
• "restore the last save".
• "go back to the version before we changed the button".
• "restore checkpoint: stable lab 2".
• "this broke everything, revert".
inspect the version history and restore the most appropriate previous version.
Do not make me manually locate commit hashes unless necessary.
Use the human-readable commit history to determine the correct version.
If my request is obvious, perform the restore rather than asking me to identify a commit hash.

6. DO NOT DESTROY NEWER WORK WITHOUT A BACKUP
Before performing any revert that would replace or discard the current working state:
create a snapshot of the CURRENT state first.
Use a message such as:
recovery-backup: before reverting to [version]
Then perform the restore.
This means even a mistaken revert can itself be undone.
The rule is:
Never destroy a recoverable state in order to recover another state.

7. SUPPORT PARTIAL REVERTS
Sometimes only one thing will be wrong.
If I say:
restore the button positioning from before but keep everything else
or:
undo only the changes to lab2.js
or:
restore the old video placement but keep the new text
do NOT automatically roll the entire project backward.
Instead:

1. inspect the relevant version history.
2. identify the specific file or source changes.
3. restore only the requested portion.
4. preserve unrelated newer work.
5. create a new commit documenting the partial restoration.
Prefer surgical restores over whole-project rollbacks when possible.

8. VERSION HISTORY SHOULD BE HUMAN-READABLE
Keep commit messages understandable.
Good examples:
visual-save: reposition scientist and monitor
feature: add verification via Slack
fix: prevent email hotspot from triggering in edit mode
content: update supplier phishing dialogue
checkpoint: stable lab 2 before branching
Avoid meaningless messages such as:
update
changes
stuff
fix2
I should be able to look at the history and understand approximately what happened.

9. SHOW ME RECENT VERSIONS ON REQUEST
If I say:
show me recent versions
give me a concise list of recent snapshots.
Show approximately:

• relative order.
• short commit identifier.
• date/time.
• description.
For example:

1. a821fd3 — visual-save: move supplier video.
2. 91fdd44 — feature: add Slack verification interaction.
3. 50b19aa — checkpoint: stable lab 2.
Do not overwhelm me with raw Git output unless I ask for it.

10. PROVIDE A SIMPLE VERSION CONTROL UI IN EDIT MODE
Add a small Version control to the existing Edit Mode toolbar.
It should provide easy access to:

• Save.
• Create Checkpoint.
• Recent Versions.
• Revert Last Save.
Optionally include:

• Restore Version.
• Compare With Previous.
Keep this lightweight.
I do not need a full Git client inside the training editor.
I primarily want protection against mistakes.

11. REVERT LAST SAVE
Add a convenient Edit Mode command:
Revert Last Save
When selected:

1. identify the source state immediately before the latest visual Edit Mode save.
2. snapshot the current state for safety.
3. restore the previous state.
4. reload/re-render the affected screen.
5. confirm the restore succeeded.
This should make experimentation with layouts extremely low-risk.

12. OPTIONAL LOCAL SNAPSHOT BACKUP
In addition to Git, you may maintain a lightweight local snapshot directory if useful.
For example:
.project-history/
However:

• Git remains the canonical history.
• snapshots should not interfere with the runtime.
• they should not be loaded by the training.
• they should not create massive unnecessary duplicates of large media files.
Do not duplicate large video or image assets on every snapshot unless those files themselves changed.

13. LARGE ASSETS
Be careful with large files such as:

• MP4.
• MOV.
• WAV.
• MP3.
• large PNG/JPEG assets.
Do not create unnecessary duplicate copies on every save.
Version references and source changes efficiently.
If Git LFS is already configured, preserve it.
Do not introduce Git LFS unless actually useful for this project.

14. NEVER AUTO-DELETE HISTORY
Do not automatically:

• squash previous versions.
• force-push.
• erase Git history.
• delete checkpoints.
• run destructive Git cleanup.
• remove branches.
• reset history permanently.
unless I explicitly request it.
The project history is a safety system.
Preserve it.

15. PROTECT WORKING VERSIONS
If the project is currently functional before a risky change, make a checkpoint first.
Especially before:

• major restructuring.
• replacing interaction systems.
• modifying SCORM.
• changing save architecture.
• converting layout systems.
• modifying core game state.
• changing navigation.
• rewriting large sections of JavaScript.
Use a checkpoint such as:
checkpoint: stable before [change]

16. CODEx DEVELOPMENT BEHAVIOR
From now on, use this workflow when modifying the project:
BEFORE CHANGE
Check the current working state.
If there are uncommitted changes, preserve them appropriately.
Create a snapshot/checkpoint when appropriate.
MAKE CHANGE
Modify only what is required.
Do not unnecessarily rewrite unrelated code.
VERIFY
Confirm the requested behavior works.
Check that unrelated functionality remains intact.
SAVE VERSION
Create a descriptive version control commit.
This workflow should become the default development behavior for this project.

17. NEVER USE VERSION CONTROL AS AN EXCUSE FOR DESTRUCTIVE EDITING
Version history is a backup system, not permission to recklessly regenerate files.
Continue following the project's non-destructive editing rule:

• preserve existing code.
• make surgical changes.
• do not rewrite the application unnecessarily.
• do not remove functionality unless explicitly requested.
The fact that something can theoretically be reverted does not make destructive editing acceptable.

18. PROTECT UNCOMMITTED USER WORK
Before switching versions, reverting, checking out another commit, or performing any Git operation that could overwrite current files:
check for uncommitted work.
If uncommitted work exists, preserve it through an appropriate snapshot or commit before continuing.
Never silently discard it.

19. VERIFY RESTORES
After any restore or revert:

1. verify the expected files were restored.
2. verify the application still loads.
3. verify the specific requested behavior returned.
4. verify unrelated newer work remains if this was a partial restore.
5. create a commit documenting the recovery action.
Example:
restore: previous supplier video positioning

20. VERSION CONTROL MUST NOT AFFECT THE LEARNER EXPERIENCE
Git, checkpoints, snapshots, editor history, and recovery tools are development functionality only.
None of this should:

• appear to learners.
• affect SCORM tracking.
• affect lesson state.
• change quiz scoring.
• affect loading behavior in production.
• expose repository information in the course UI.
The learner-facing training should remain clean.

21. FIRST IMPLEMENTATION STEP
Before changing anything:

1. inspect whether Git already exists.
2. inspect the current project state.
3. identify any existing uncommitted work.
4. create an initial safe baseline.
5. configure an appropriate .gitignore.
6. confirm the baseline can be restored.
7. then implement the continuous version system.
Create an initial checkpoint named something like:
checkpoint: baseline before continuous version control
Do NOT modify project functionality before establishing this baseline.

22. MOST IMPORTANT RULE
My priority is fearless experimentation.
I want to be able to tell you:
try moving this
change this interaction
redesign this screen
make this animation more dramatic
and know that if the result is bad, I can simply say:
"Revert that."
You should know what changed, preserve my current state before reverting, and quickly restore the previous working version.
The version control system should make experimentation safer while remaining invisible to the actual learner.
