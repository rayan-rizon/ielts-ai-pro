create index paired_test_rooms_host_id_idx on public.paired_test_rooms(host_id);
create index paired_test_rooms_passage_id_idx on public.paired_test_rooms(passage_id);
create index paired_test_events_room_id_idx on public.paired_test_events(room_id);
create index paired_test_events_user_id_idx on public.paired_test_events(user_id);
create index test_sessions_paired_room_id_idx on public.test_sessions(paired_room_id);
