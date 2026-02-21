from app.services.show_id import generate_show_id, normalize_artist_name


class TestNormalizeArtistName:
    def test_basic(self) -> None:
        assert normalize_artist_name("Phish") == "phish"

    def test_multiple_words(self) -> None:
        assert normalize_artist_name("Trey Anastasio") == "trey-anastasio"

    def test_trailing_punctuation(self) -> None:
        assert normalize_artist_name("moe.") == "moe"

    def test_special_characters(self) -> None:
        assert normalize_artist_name("AC/DC") == "ac-dc"

    def test_ampersand(self) -> None:
        assert normalize_artist_name("Simon & Garfunkel") == "simon-garfunkel"

    def test_whitespace(self) -> None:
        assert normalize_artist_name("  Phish  ") == "phish"

    def test_consecutive_special(self) -> None:
        assert normalize_artist_name("The (Allman) Brothers") == "the-allman-brothers"

    def test_numbers(self) -> None:
        assert normalize_artist_name("STS9") == "sts9"

    def test_apostrophe(self) -> None:
        assert normalize_artist_name("Umphrey's McGee") == "umphrey-s-mcgee"


class TestGenerateShowId:
    def test_basic(self) -> None:
        result = generate_show_id("2026-02-13", "Phish", "abc-def-123-456-789")
        assert result == "2026-02-13-phish-abc-def-123-456-789"

    def test_with_sequence(self) -> None:
        result = generate_show_id("2026-02-13", "Phish", "abc-def-123-456-789", 1)
        assert result == "2026-02-13-phish-abc-def-123-456-789-1"

    def test_sequence_zero_ignored(self) -> None:
        result = generate_show_id("2026-02-13", "Phish", "abc-def-123-456-789", 0)
        assert result == "2026-02-13-phish-abc-def-123-456-789"

    def test_no_sequence(self) -> None:
        result = generate_show_id("2026-02-13", "Phish", "abc-def-123-456-789", None)
        assert result == "2026-02-13-phish-abc-def-123-456-789"

    def test_multi_word_artist(self) -> None:
        result = generate_show_id(
            "2024-08-10", "Dead & Company", "abc-def-123-456-789"
        )
        assert result == "2024-08-10-dead-company-abc-def-123-456-789"
