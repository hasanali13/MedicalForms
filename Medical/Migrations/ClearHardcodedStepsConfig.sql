-- Clear existing form configuration to remove hardcoded step names
-- This will be recreated automatically with generic "Step 1"

DELETE FROM [ViewPublicForm] WHERE [IsConfig] = 1;
