create virtual table if not exists session_search using fts5(
  session_id UNINDEXED,
  title,
  preview,
  normalized_text
);

create trigger if not exists sessions_ai after insert on sessions begin
  insert into session_search(rowid, session_id, title, preview, normalized_text)
  values (new.rowid, new.id, new.title, new.preview, new.search_text);
end;

create trigger if not exists sessions_au after update of title, preview, search_text on sessions begin
  update session_search
  set session_id = new.id,
      title = new.title,
      preview = new.preview,
      normalized_text = new.search_text
  where rowid = old.rowid;
end;

create trigger if not exists sessions_ad after delete on sessions begin
  delete from session_search where rowid = old.rowid;
end;
