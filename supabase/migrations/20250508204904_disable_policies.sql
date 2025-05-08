-- Migration: Disable all RLS policies
-- Description: Drops all previously defined RLS policies
-- Author: Cascade AI
-- Date: 2025-05-08

-- Drop policies for generations table
drop policy if exists "Users can view their own generations" on generations;
drop policy if exists "Users can insert their own generations" on generations;
drop policy if exists "Users can update their own generations" on generations;
drop policy if exists "Users can delete their own generations" on generations;

-- Drop policies for flashcards table
drop policy if exists "Users can view their own flashcards" on flashcards;
drop policy if exists "Users can insert their own flashcards" on flashcards;
drop policy if exists "Users can update their own flashcards" on flashcards;
drop policy if exists "Users can delete their own flashcards" on flashcards;

-- Drop policies for generation_error_logs table
drop policy if exists "Users can view their own error logs" on generation_error_logs;
drop policy if exists "Users can insert their own error logs" on generation_error_logs;
drop policy if exists "Users can update their own error logs" on generation_error_logs;
drop policy if exists "Users can delete their own error logs" on generation_error_logs;
