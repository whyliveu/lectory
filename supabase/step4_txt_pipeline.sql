alter table lectures
add column if not exists error_message text;

alter table lecture_files
alter column file_type set default 'txt';

alter table lecture_files
add column if not exists clean_text text;
