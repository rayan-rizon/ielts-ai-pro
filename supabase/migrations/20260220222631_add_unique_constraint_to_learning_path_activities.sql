-- Add a unique constraint to learning_path_activities to allow upserting by (learning_path_id, activity_key)

ALTER TABLE "public"."learning_path_activities"
ADD CONSTRAINT "learning_path_activities_learning_path_id_activity_key_key" UNIQUE ("learning_path_id", "activity_key");
