import {
  buildLibraryGroups,
  rankPracticeNeeds,
  scoreLibraryGroup,
  publicPracticeContent,
  practiceTips,
  libraryGroupSource,
  savedLibraryExplanations,
} from '../_shared/skill-lab/libraryPractice.js';

export async function handleLibraryPractice(client: any, authId: string, body: any) {
  const rpc = async (name: string, args: any) => {
    const { data, error } = await client.rpc(name, args);
    if (error) throw new Error(error.message);
    return data;
  };
  const state = (action: string, data = {}) =>
    rpc('practice_library_state', {
      p_auth: authId,
      p_action: action,
      p_session: body.sessionId || null,
      p_data: data,
    });
  const enrichPassageTitle = async (rawSource: any, questions: any[] = []) => {
    const source = { ...(rawSource || {}) };
    // Older sessions were created before section passage titles were included
    // in the snapshot. Fetch only this display metadata so their original
    // question and passage snapshot remains unchanged.
    if (!source.passage_title && source.id && Array.isArray(questions)) {
      const { data: passage, error: passageError } = await client
        .from('passages')
        .select('id,title,test_type,content,audio_url,duration_minutes')
        .eq('id', source.id)
        .maybeSingle();
      if (!passageError && passage) {
        const metadataQuestions = questions.map((question: any) => ({
          ...question,
          section: question.section || question.part_number || source.section,
        }));
        const metadata = libraryGroupSource(passage, metadataQuestions);
        if (metadata.passage_title) source.passage_title = metadata.passage_title;
      }
    }
    return source;
  };
  const view = async (s: any) => {
    const snapshot = s.snapshot || {};
    const source = await enrichPassageTitle(snapshot.source, snapshot.questions);
    const mistakeSource = await enrichPassageTitle(snapshot.mistake, snapshot.mistake?.questions);
    return {
      id: s.id,
      focus: s.focus,
      answers: s.answers,
      stage: s.stage,
      completed_at: s.completed_at,
      familiarity: s.familiarity,
      assisted: s.assisted,
      next_review_at: s.next_review_at,
      activity_id: s.activity_id,
      source_session_id: s.source_session_id,
      source: { ...source, content: publicPracticeContent(source.content) },
      questions: publicPracticeContent(snapshot.questions),
      tips: practiceTips(s.focus),
      result: s.result,
      // Only previously answered material may include an answer/explanation before submission.
      mistake: mistakeSource.id ? { ...snapshot.mistake, ...mistakeSource } : null,
      explanations: s.completed_at ? savedLibraryExplanations(snapshot.questions) : [],
    };
  };
  if (body.action === 'resume') return await view(await state('resume'));
  if (body.action === 'save') {
    return await view(await state('save', { answers: body.answers, stage: body.stage }));
  }
  if (body.action === 'submit') {
    const s = await state('resume');
    if (s.completed_at) return await view(s);
    if (
      !body.answers ||
      Array.isArray(body.answers) ||
      typeof body.answers !== 'object' ||
      JSON.stringify(body.answers).length > 30000
    )
      throw new Error('Invalid answers');
    const result = scoreLibraryGroup(s.focus.split(':')[0], s.snapshot.questions, body.answers);
    return await view(await state('complete', { answers: body.answers, result }));
  }
  if (!['dashboard', 'start'].includes(body.action)) throw new Error('Unknown practice action');
  // Explanations are ~1.2 MB of the catalogue and are only ever read once a set
  // is started (they go into the persisted snapshot) or a completed one is
  // reviewed. The dashboard builds group summaries and never touches them.
  const needsExplanations = body.action === 'start';
  const [dashboard, catalogue] = await Promise.all([
    state('dashboard'),
    rpc('practice_library_catalogue', {
      p_auth: authId,
      p_include_explanations: needsExplanations,
    }),
  ]);
  const groups = (catalogue.passages || []).flatMap((p: any) =>
    buildLibraryGroups(p, catalogue.questions || [])
  );
  const exposures = new Set(dashboard.exposures.map((e: any) => e.source_id));
  const attemptedSources = new Set((catalogue.history || []).map((s: any) => s.passage_id));
  const summaries = groups
    .filter((g: any) => g.eligible)
    .map((g: any) => ({
      id: g.id,
      sourceId: g.sourceId,
      title: g.title,
      focus: g.focus,
      total: g.total,
      section: g.source.section,
      startNumber: g.questions[0].question_number,
      audioScope: g.source.audio_scope,
      familiarity: dashboard.exposures.some((e: any) => e.group_id === g.id)
        ? 'repeated'
        : exposures.has(g.sourceId) || attemptedSources.has(g.sourceId)
          ? 'familiar'
          : 'new',
    }));
  const attempts: any[] = [];
  for (const old of catalogue.history || []) {
    const answers = old.content_data?.savedAnswers;
    // Aggregate legacy totals are not enough to reconstruct the student's answer.
    if (!answers || typeof answers !== 'object' || Array.isArray(answers)) continue;
    for (const group of groups.filter((g: any) => g.sourceId === old.passage_id && g.eligible)) {
      const scored = scoreLibraryGroup(old.test_type, group.questions, answers);
      attempts.push({
        focus: group.focus,
        sourceId: group.sourceId,
        groupId: group.id,
        sessionId: old.id,
        title: group.title,
        completedAt: old.completed_at,
        ...scored,
      });
    }
  }
  for (const s of dashboard.sessions)
    if (s.completed_at && s.result)
      attempts.push({
        practice: true,
        focus: s.focus,
        sourceId: s.source_id,
        groupId: s.group_id,
        sessionId: s.id,
        completedAt: s.completed_at,
        nextReviewAt: s.next_review_at,
        assisted: s.assisted,
        repeated: s.familiarity === 'repeated',
        familiar: s.familiarity === 'familiar',
        ...s.result,
      });
  const recommendations = rankPracticeNeeds(attempts).filter((r: any) =>
    summaries.some((g: any) => g.focus === r.focus)
  );
  if (body.action === 'dashboard') return { ...dashboard, groups: summaries, recommendations };
  const group = groups.find((g: any) => g.id === body.groupId && g.eligible);
  if (!group) throw new Error('This question set is unavailable. Choose another library set.');
  const source = catalogue.passages.find((p: any) => p.id === group.sourceId);
  const snapshot = {
    questions: group.questions,
    source: libraryGroupSource(source, group.questions),
    mistake: null as any,
  };
  const need = recommendations.find((r: any) => r.focus === group.focus);
  const mistakeRef = need?.mistakes.find(
    (m: any) => !body.sourceSessionId || m.sessionId === body.sourceSessionId
  );
  if (mistakeRef?.practice) {
    const previous = await rpc('practice_library_state', {
      p_auth: authId,
      p_action: 'resume',
      p_session: mistakeRef.sessionId,
      p_data: {},
    });
    if (previous.completed_at && previous.focus === group.focus) {
      snapshot.mistake = {
        ...previous.snapshot.source,
        content: publicPracticeContent(previous.snapshot.source.content),
        questions: publicPracticeContent(previous.snapshot.questions),
        answers: previous.answers,
        result: previous.result,
        explanations: savedLibraryExplanations(previous.snapshot.questions),
      };
    }
  } else if (mistakeRef) {
    const old = catalogue.history.find((s: any) => s.id === mistakeRef.sessionId);
    const original = groups.find((g: any) => g.id === mistakeRef.groupId);
    const oldSource = catalogue.passages.find((p: any) => p.id === mistakeRef.sourceId);
    if (old && original && oldSource) {
      const result = scoreLibraryGroup(
        old.test_type,
        original.questions,
        old.content_data.savedAnswers
      );
      snapshot.mistake = {
        ...libraryGroupSource(oldSource, original.questions),
        questions: publicPracticeContent(original.questions),
        answers: old.content_data.savedAnswers,
        result,
        explanations: savedLibraryExplanations(original.questions),
      };
    }
  }
  const canonicalSnapshot = { ...snapshot, mistake: null };
  const bytes = new TextEncoder().encode(JSON.stringify(canonicalSnapshot));
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  const version = Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  await rpc('practice_library_index', {
    p_group: { ...group, snapshot: canonicalSnapshot, version },
  });
  return await view(
    await state('start', {
      group_id: group.id,
      request_id: body.requestId,
      source_session_id:
        body.sourceSessionId || (mistakeRef?.practice ? null : mistakeRef?.sessionId),
      activity_id: body.activityId,
      mistake: snapshot.mistake,
    })
  );
}
