I am building an interactive HTML training experience with point-and-click interactions, mini-games, images, video, buttons, scrolling areas, overlays, dialogue, and other positioned UI elements.
I want you to add a persistent VISUAL EDIT MODE that lets me manually reposition and adjust elements directly in the browser without having to describe pixel-perfect changes to you.
PRIMARY GOAL
When Edit Mode is enabled, I should be able to visually manipulate elements on the page, save those changes, and have the changes written permanently back into the actual project HTML/CSS so that they remain after refresh and after Edit Mode is turned off.
This must be implemented in a way that does not break, overwrite, regenerate, simplify, or remove any existing functionality in the training.
Existing animations, game logic, branching, audio, video, SCORM functionality, quiz logic, variables, event listeners, transitions, interactions, and styling must remain intact unless I explicitly edit them.

1. EDIT MODE TOOLBAR
Add an Edit Mode toolbar fixed to the TOP of the screen.
It should visually feel like a small developer/editor toolbar and should only appear when Edit Mode is enabled.
Include controls for:

    Edit Mode ON / OFF
    Select / Move
    Resize
    Edit Buttons / Interactive Elements
    Edit Scroll Areas / Containers
    Edit Text
    Delete Selected Element
    Lock / Unlock Element
    Undo
    Redo
    Reset Selected Element
    Save
    Exit Edit Mode

Clearly show which editing tool is currently active.
Do not allow the toolbar itself to accidentally become selectable or draggable.

2. ELEMENT SELECTION
When Edit Mode is ON, I should be able to click an element to select it.
Selectable elements should include, where practical:

    images
    videos
    buttons
    icons
    cards
    dialogue boxes
    text blocks
    overlays
    interactive hotspots
    game objects
    UI panels
    scrolling containers
    decorative assets
    positioned HTML elements

When selected:

    draw a visible bounding box around the element
    render distinct, high-contrast, visually prominent resize handles at all 8 bounding points (corners and edges: NW, N, NE, E, SE, S, SW, W)
    identify the element with a small label
    show useful positioning information such as X, Y, width, and height

Normal lesson interactions should NOT fire when I am clicking elements for editing.
For example, selecting a button in Edit Mode should not trigger the button's normal lesson action.

3. DRAG TO REPOSITION
When Move is active:
Allow me to click and drag the selected element anywhere appropriate within its existing parent/container.
I should be able to visually position it exactly where I want it.
Support:

    mouse drag
    trackpad
    arrow-key nudging
    Shift + arrow for larger nudges

Whenever possible, preserve the element's existing positioning model rather than unnecessarily changing the entire layout system.
Do not convert unrelated elements to absolute positioning just because one object was moved.

4. RESIZING & VISIBLE HANDLES
When Resize is active (or whenever an editable element is selected):
Allow selected images, videos, panels, buttons, and appropriate containers to be resized using clear, visually present handles.
Handles MUST be visibly rendered on the screen around the bounding box (corners and midpoints) so the user can easily see and grab them without guessing.
Preserve aspect ratio for media by default.
Allow holding Shift or using an appropriate control to override the aspect ratio if needed.

5. DELETING / REMOVING ELEMENTS
Edit Mode must provide the ability to delete or remove unwanted elements from the screen, not just move or resize them.
Allow me to delete the currently selected element using:

    a dedicated "Delete" button in the Edit Mode toolbar
    the Delete key on the keyboard
    the Backspace key on the keyboard

Requirements for Deletion:

    Deletion must be non-destructive to the rest of the application.
    Locked elements must not be deleted accidentally.
    Undo must immediately restore the deleted element with its exact previous state, styles, and interactions.
    Redo must re-delete the element.
    When saved, the deleted state must persist permanently in the source (e.g. surgical CSS display: none / node removal) so the element remains gone after reload.
    Provide a way to reset/restore elements if needed.

6. BUTTONS AND INTERACTIVE ELEMENTS
I frequently need to reposition, resize, or remove buttons and clickable game elements.
Edit Mode must allow me to manipulate these without destroying their original behavior.
For example, if a button already has:

    an onclick handler
    an event listener
    a data attribute
    a game action
    a navigation action
    a quiz action
    audio attached
    SCORM tracking

those behaviors must remain exactly as they were.
Editing position or size should change presentation only.

6. SCROLLING AREAS AND CONTAINERS
Allow me to select scrolling panels and containers.
For these elements, let me adjust things such as:

    position
    width
    height
    visible viewport size

Do NOT accidentally remove overflow behavior, scroll logic, nested interactions, or content.
If I am editing the container, make it clear that I have selected the container rather than an item inside it.
Provide a reasonable way to move between parent and child selection when elements overlap.

7. LAYERS / OVERLAPPING OBJECTS
Interactive training screens frequently contain overlapping objects.
Add a lightweight way to choose the correct element when multiple objects occupy the same area.
For example:

    cycle through elements under the cursor
    a small context menu
    parent/child selection
    layer selection

Also provide simple:

    Bring Forward
    Send Backward
    Bring to Front
    Send to Back

controls when applicable.
Do not modify z-index unless I explicitly use one of these controls.

8. LOCKING
Allow elements to be locked.
A locked element should:

    remain visible
    continue working normally
    not move or resize accidentally in Edit Mode

Provide a visible indication that the selected element is locked.

9. SAVE MUST BE PERMANENT
This is extremely important.
When I click SAVE, the visual changes I made must be written into the actual project source so they persist after:

    browser refresh
    closing and reopening the HTML file
    restarting the project
    disabling Edit Mode

Do NOT treat localStorage, sessionStorage, IndexedDB, or temporary browser state as the final saved version.
Those may be used temporarily while editing, but clicking SAVE must ultimately update the real source file.
If browser security prevents a normal webpage from directly overwriting its own HTML file, implement the safest appropriate development workflow for this project, such as:

    the File System Access API where supported,
    a local development endpoint,
    or a small companion development script/server that writes the approved changes back to the current project file.

Use whichever solution is most reliable in the current Codex/local development environment.
The important requirement is:
SAVE means update the actual project source file.
Do not silently pretend a browser-only localStorage save is equivalent.

10. SURGICAL SAVING — DO NOT REGENERATE THE FILE
Saving edits must be NON-DESTRUCTIVE.
Do NOT regenerate or rewrite the entire application from scratch when I click Save.
Do NOT replace the existing HTML with a newly generated approximation.
Instead:

    Identify exactly which element properties I changed.
    Update only the corresponding source values/styles/classes/rules required for those changes.
    Preserve everything else exactly as much as possible.

This is critical because I may have substantial game logic and custom code elsewhere in the file.
A visual position change must never erase unrelated work.

11. PRESERVE EXISTING CODE
Before implementing this feature, inspect the existing project architecture.
Treat all existing functionality as protected.
Unless required for Edit Mode, do not alter:

    JavaScript game logic
    event handlers
    animation timing
    audio
    video behavior
    branching logic
    quiz logic
    scoring
    SCORM communication
    transitions
    state variables
    IDs
    data attributes
    CSS unrelated to edited elements
    asset paths
    preload logic
    keyboard controls
    existing responsive behavior

If you need to modify existing code to support Edit Mode, make the smallest possible change.

12. STABLE ELEMENT IDENTIFICATION
Do not rely exclusively on DOM index positions such as:
document.querySelectorAll("div")[17]
because those are fragile.
Give editable objects stable identifiers where necessary, such as:
data-editor-id="supplier-email-panel"
Reuse existing IDs when they are already unique and safe.
This will allow saved visual changes to reliably map back to the correct source element.
Do not unnecessarily rename existing IDs because existing game logic may depend on them.

13. RESPONSIVE POSITIONING
Be careful about responsive layouts.
If an element already uses:

    percentages
    flexbox
    grid
    transforms
    anchors
    responsive CSS
    CSS variables

preserve that system wherever practical.
Do not automatically turn everything into fixed pixel coordinates.
If I manually move an element, determine the least destructive way to represent that adjustment.
For highly visual game screens where precise placement is intentional, pixel positioning is acceptable.

15. UNDO / REDO
Maintain an Edit Mode history.
Undo and Redo should affect editing changes only.
They must not rewind or alter gameplay state.
At minimum, track:

    movement
    resizing
    deleting / restoring elements
    text edits
    layer changes
    locking/unlocking



15. UNSAVED CHANGES
Track whether Edit Mode contains unsaved modifications.
Show a clear indicator such as:
Unsaved Changes
After a successful save, change this to:
Saved
If I attempt to leave Edit Mode or close/reload the page while edits are unsaved, warn me.
Do not automatically discard them.

16. SAVE FEEDBACK
When Save succeeds, display a small confirmation:
Saved to source
If saving fails, DO NOT display a fake success state.
Instead show:
Save failed — source file was not modified
and provide the relevant error in the developer console.

17. EDIT MODE MUST NOT APPEAR IN THE ACTUAL COURSE
The learner-facing course should behave exactly as before.
Edit Mode should only activate through an intentional development mechanism.
For example:

    keyboard shortcut
    query parameter such as ?edit=true
    hidden development control
    explicit developer toggle

Do not show editing controls to normal learners.
When Edit Mode is OFF:

    no selection outlines
    no resize handles
    no editing toolbar
    no editor labels
    no drag behavior
    no editor-specific cursor behavior

The experience should return completely to normal.

18. KEYBOARD SHORTCUT
Please add a convenient shortcut for toggling Edit Mode.
Suggested:
Command/Ctrl + Shift + E
Make sure it does not conflict with an existing important shortcut in the project.

19. EDITOR ARCHITECTURE
Keep the editor code modular.
Prefer something conceptually like:

    editorState
    selectionManager
    dragManager
    resizeManager
    historyManager
    saveManager

rather than scattering editing logic throughout the lesson code.
Editor functionality should be isolated from the gameplay system as much as possible.

20. IMPORTANT DEVELOPMENT RULE
From this point forward, whenever you modify this project:
Do not remove or rewrite the Edit Mode system unless I explicitly request it.
New screens and major visual elements should be made compatible with Edit Mode whenever practical.
The editor should become a persistent development tool for this training project.

21. BEFORE MAKING CHANGES
First inspect the current project and determine:

    how the HTML is structured
    how styles are stored
    whether elements are positioned inline or through CSS
    how JavaScript interactions are attached
    whether there is already a local development server
    whether the project is one HTML file or multiple files
    what the safest source-writing mechanism is

Then implement Edit Mode around the existing architecture.
Do not rebuild the training merely to make the editor easier to implement.

22. TEST AFTER IMPLEMENTATION
After implementing this, test this exact workflow:

    Load the training normally.
    Confirm the existing training still works.
    Enter Edit Mode.
    Select an image.
    Drag the image.
    Resize the image.
    Select a button.
    Move the button.
    Confirm clicking it in Edit Mode does not trigger its gameplay action.
    Save.
    Refresh the page.
    Confirm the moved elements remain in their new locations.
    Exit Edit Mode.
    Confirm the button's original gameplay action still works.
    Confirm unrelated interactions still work.
    Reopen the actual source file and verify the saved positioning changes exist in the source.
    Confirm no unrelated code was removed or regenerated.

If any of these tests fail, fix the issue before considering the Edit Mode implementation complete.
MOST IMPORTANT CONSTRAINT
Think of Edit Mode as a non-destructive visual authoring layer sitting on top of my existing training.
I want to be able to build sophisticated interactive lessons with Codex, then make the final 5–20 pixel visual adjustments myself without asking you to guess what I mean.
Visual edits may change the properties I intentionally modify. They must not damage, simplify, overwrite, or unsave anything else in the project.
