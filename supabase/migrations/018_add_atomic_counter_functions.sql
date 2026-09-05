-- Migration 018: Fungsi atomik untuk menaikkan/menurunkan counter "likes" dan "views" pada
-- tabel News & Ebook. Sebelumnya kode melakukan SELECT nilai lalu UPDATE nilai+1 secara terpisah,
-- yang rentan race condition (dua request bersamaan bisa saling menimpa dan kehilangan satu hitungan).
-- Fungsi ini melakukan UPDATE ... SET kolom = kolom + delta dalam satu statement atomik.
CREATE OR REPLACE FUNCTION increment_counter(p_table TEXT, p_column TEXT, p_id UUID, p_delta INTEGER)
RETURNS INTEGER AS $$
DECLARE
  result INTEGER;
BEGIN
  IF p_table NOT IN ('News', 'Ebook') THEN
    RAISE EXCEPTION 'Invalid table: %', p_table;
  END IF;

  IF p_column NOT IN ('likes', 'views') THEN
    RAISE EXCEPTION 'Invalid column: %', p_column;
  END IF;

  EXECUTE format(
    'UPDATE %I SET %I = GREATEST(0, %I + $1) WHERE id = $2 RETURNING %I',
    p_table, p_column, p_column, p_column
  )
  INTO result
  USING p_delta, p_id;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
