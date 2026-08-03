-- Keep public blog calls-to-action on crawlable landing pages rather than
-- authenticated routes that are intentionally blocked in robots.txt.
-- Also remove the one link to an unpublished article found by the
-- 2026-08-03 Ubersuggest site audit.
update public.resources
set content = replace(
  replace(
    replace(
      replace(
        replace(
          replace(
            replace(
              replace(
                content,
                '<a href="/blog/ielts-reading-multiple-choice-tips">multiple-choice evidence method</a>',
                '<a href="/cambridge-ielts-practice-tests#reading">IELTS Reading practice hub</a>'
              ),
              'href="/reading"',
              'href="/cambridge-ielts-practice-tests#reading"'
            ),
            'href="/listening"',
            'href="/cambridge-ielts-practice-tests#listening"'
          ),
          'href="/writing"',
          'href="/ielts-writing-checker"'
        ),
        'href="/speaking"',
        'href="/ielts-speaking-practice-ai"'
      ),
      'href="/cambridge-tests"',
      'href="/cambridge-ielts-practice-tests"'
    ),
    'href="/resources"',
    'href="/blog"'
  ),
  'href="/analytics"',
  'href="/ielts-band-score-calculator"'
)
where content_type = 'blog'
  and content is not null
  and (
    content like '%/blog/ielts-reading-multiple-choice-tips%'
    or content like '%href="/reading"%'
    or content like '%href="/listening"%'
    or content like '%href="/writing"%'
    or content like '%href="/speaking"%'
    or content like '%href="/cambridge-tests"%'
    or content like '%href="/resources"%'
    or content like '%href="/analytics"%'
  );
