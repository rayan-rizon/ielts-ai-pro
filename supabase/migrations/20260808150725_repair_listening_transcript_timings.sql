-- Repair only the two Listening parts whose stored SRT timing evidence was
-- irrecoverably corrupted. The replacement cues were aligned against the
-- existing audio and accepted only after chronology, duration, speaker, and
-- sequential-text validation. Cambridge 18 Test 4 is intentionally excluded:
-- its four current R2 objects are duplicates of Cambridge 17 Test 4 audio.

DO $migration$
DECLARE
  affected_rows integer;
BEGIN
  UPDATE public.passages
  SET content = jsonb_set(
        content::jsonb,
        '{0,srt_content}',
        to_jsonb($srt_2020$
1
00:00:00,700 --> 00:00:01,280
ANNOUNCER: Part 1.

2
00:00:02,600 --> 00:00:08,800
ANNOUNCER: You will hear a woman who works at an employment agency talking to a man about jobs he could apply for.

3
00:00:10,500 --> 00:00:14,100
ANNOUNCER: First, you have some time to look at questions 1 to 5.

4
00:00:39,800 --> 00:00:43,600
ANNOUNCER: Now listen carefully and answer questions 1 to 5.

5
00:00:47,200 --> 00:00:55,500
SALLY: Good morning. Thanks for coming in to see us here at the agency, Joe. I'm one of the agency representatives and my name's Sally Baker.

6
00:00:55,800 --> 00:00:58,500
JOE: Hi Sally. I think we spoke on the phone, didn't we?

7
00:00:58,800 --> 00:00:59,800
SALLY: That's right, we did.

8
00:01:00,050 --> 00:01:08,990
SALLY: So, thank you for sending in your CV. We've had quite a careful look at it and I think we have two jobs that might be suitable for you.

9
00:01:09,200 --> 00:01:09,500
JOE: Okay.

10
00:01:10,010 --> 00:01:15,990
SALLY: The first one is in a company based in North London. They're looking for an administrative assistant.

11
00:01:16,360 --> 00:01:16,760
JOE: Okay.

12
00:01:17,400 --> 00:01:18,900
JOE: What sort of company is it?

13
00:01:19,600 --> 00:01:23,990
SALLY: They're called Home Solutions and they design and make furniture.

14
00:01:24,690 --> 00:01:28,790
JOE: Oh, I don't know much about that, but it sounds interesting.

15
00:01:29,190 --> 00:01:37,990
SALLY: Yes, well, as I said, they want someone in their office and looking at your past experience, it does look as if you fit quite a few of the requirements.

16
00:01:38,590 --> 00:01:41,990
SALLY: So, on your CV, it appears you've done some data entry.

17
00:01:42,500 --> 00:01:42,800
JOE: Yes.

18
00:01:43,600 --> 00:01:45,100
SALLY: So that's one skill they want.

19
00:01:45,600 --> 00:01:50,200
SALLY: Then they expect the person they appoint to attend meetings and take notes there.

20
00:01:50,700 --> 00:01:51,000
JOE: Okay.

21
00:01:51,600 --> 00:01:52,800
JOE: I've done that before, yes.

22
00:01:53,400 --> 00:01:56,200
SALLY: And you need to be able to cope with general admin.

23
00:01:56,800 --> 00:01:58,900
SALLY: Filing and keeping records and so on.

24
00:01:59,300 --> 00:02:00,600
JOE: That should be okay.

25
00:02:01,200 --> 00:02:04,100
JOE: And in my last job, I also had to manage the diary.

26
00:02:04,700 --> 00:02:05,300
SALLY: Excellent.

27
00:02:06,000 --> 00:02:07,400
SALLY: That's something they want here too.

28
00:02:08,000 --> 00:02:12,200
SALLY: I'd suggest you add it to your CV. I don't think you mentioned that, did you?

29
00:02:12,600 --> 00:02:12,900
JOE: No.

30
00:02:13,800 --> 00:02:21,500
SALLY: So, as far as the requirements go, they want good computer skills, of course, and they particularly mention spreadsheets.

31
00:02:22,100 --> 00:02:22,800
JOE: That should be fine.

32
00:02:23,500 --> 00:02:27,900
SALLY: And interpersonal skills, which would be something they'd check with your references.

33
00:02:28,500 --> 00:02:30,700
JOE: I think that should be okay, yes.

34
00:02:31,500 --> 00:02:36,200
SALLY: Then they mention that they want someone who is careful and takes care with details.

35
00:02:37,000 --> 00:02:40,400
SALLY: Just looking at your CV, I'd say you're probably all right there.

36
00:02:40,800 --> 00:02:41,800
JOE: I think so, yes.

37
00:02:42,500 --> 00:02:44,900
JOE: Do they want any special experience?

38
00:02:45,500 --> 00:02:48,800
SALLY: I think they wanted some experience of teleconferencing.

39
00:02:49,200 --> 00:02:51,300
JOE: Oh, I've got three years experience of that.

40
00:02:52,100 --> 00:02:52,900
SALLY: Uh-huh, let's see.

41
00:02:53,500 --> 00:02:54,400
SALLY: Yes, good.

42
00:02:54,400 --> 00:02:58,700
SALLY: In fact, they're only asking for at least one year, so that's great.

43
00:02:59,300 --> 00:03:01,400
SALLY: So, is that something that might interest you?

44
00:03:01,800 --> 00:03:02,900
JOE: It is, yes.

45
00:03:03,800 --> 00:03:09,700
JOE: The only thing is, you said they were in North London, so it would be quite a long commute for me.

46
00:03:10,100 --> 00:03:10,600
SALLY: Okay.

47
00:03:14,500 --> 00:03:20,500
ANNOUNCER: Before you hear the rest of the conversation, you have some time to look at questions 6 to 10.

48
00:03:46,100 --> 00:03:49,100
ANNOUNCER: Now listen and answer questions 6 to 10.

49
00:03:52,600 --> 00:03:56,200
SALLY: So, the second position might suit you better as far as the location goes.

50
00:03:56,800 --> 00:04:00,400
SALLY: That's for a warehouse assistant, and that's in South London.

51
00:04:00,800 --> 00:04:02,500
JOE: Yes, that would be a lot closer.

52
00:04:03,100 --> 00:04:05,100
SALLY: And you've worked in a warehouse before, haven't you?

53
00:04:05,500 --> 00:04:05,800
JOE: Yes.

54
00:04:06,500 --> 00:04:14,900
SALLY: So, as far as the responsibilities for this position go, they want someone who could manage the stock, obviously, and also deliveries.

55
00:04:15,700 --> 00:04:16,600
JOE: That should be okay.

56
00:04:17,400 --> 00:04:21,900
JOE: You've got to keep track of stuff, but I've always been quite good with numbers.

57
00:04:22,300 --> 00:04:22,700
SALLY: Good.

58
00:04:23,400 --> 00:04:24,800
SALLY: That's their first requirement.

59
00:04:25,500 --> 00:04:28,900
SALLY: And they want someone who's computer literate, which we know you are.

60
00:04:29,300 --> 00:04:29,700
JOE: Sure.

61
00:04:30,600 --> 00:04:32,600
SALLY: Then they mention organizational skills.

62
00:04:33,400 --> 00:04:35,300
SALLY: They want someone who's well organized.

63
00:04:35,800 --> 00:04:37,700
JOE: Yes, I think I am.

64
00:04:38,500 --> 00:04:39,500
SALLY: And tidy?

65
00:04:40,300 --> 00:04:43,100
JOE: Yes, they go together really, don't they?

66
00:04:43,500 --> 00:04:43,900
SALLY: Sure.

67
00:04:44,500 --> 00:04:49,700
SALLY: Then the usual stuff, they want someone who can communicate well both orally and in writing.

68
00:04:50,100 --> 00:04:50,400
JOE: Okay.

69
00:04:51,100 --> 00:05:00,100
JOE: And for the last warehouse job I had, one of the things I enjoyed most was being part of a team. I found that was really essential for the job.

70
00:05:00,600 --> 00:05:01,200
SALLY: Excellent.

71
00:05:02,000 --> 00:05:05,500
SALLY: Yes, they do mention that they want someone who's used to that, yes.

72
00:05:06,200 --> 00:05:12,100
SALLY: Now, when you were working in a warehouse last time, what sorts of items were you dealing with?

73
00:05:12,600 --> 00:05:18,600
JOE: It was mostly bathroom and kitchen equipment, sinks and stoves and fridges.

74
00:05:19,200 --> 00:05:21,700
SALLY: So, you're okay moving heavy things?

75
00:05:22,200 --> 00:05:25,400
JOE: Sure. I'm quite strong and I've had the training.

76
00:05:25,800 --> 00:05:26,100
SALLY: Good.

77
00:05:26,900 --> 00:05:37,800
SALLY: Now, as far as experience goes, they mention they want someone with a license and that you have experience of driving in London, so you can cope with the traffic and so on.

78
00:05:38,200 --> 00:05:39,400
JOE: Yes, no problem.

79
00:05:40,000 --> 00:05:42,100
SALLY: And you've got experience of warehouse work.

80
00:05:42,800 --> 00:05:45,500
SALLY: And the final thing they mention is customer service.

81
00:05:45,900 --> 00:05:49,100
SALLY: I think, looking at your CV, you're okay there.

82
00:05:49,500 --> 00:05:49,800
JOE: Right.

83
00:05:50,300 --> 00:05:53,700
JOE: So, what about pay? Can you tell me a bit more about that, please?

84
00:05:57,300 --> 00:05:59,100
ANNOUNCER: That is the end of Part One.

85
00:06:00,800 --> 00:06:04,600
ANNOUNCER: You now have one minute to check your answers to Part One.
$srt_2020$::text),
        false
      )::text,
      updated_at = now()
  WHERE id = '04df371b-5457-4d59-b59d-cde435afe5d9'::uuid
    AND test_type = 'listening'
    AND cambridge_year = 2020
    AND cambridge_test_number = 3
    AND jsonb_typeof(content::jsonb) = 'array'
    AND jsonb_array_length(content::jsonb) = 4;

  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  IF affected_rows <> 1 THEN
    RAISE EXCEPTION 'Expected one Cambridge 15 Test 3 Listening passage, updated %', affected_rows;
  END IF;

  UPDATE public.passages
  SET content = jsonb_set(
        content::jsonb,
        '{2,srt_content}',
        to_jsonb($srt_2022$
1
00:00:00,000 --> 00:00:01,000
ANNOUNCER: Part 3.

2
00:00:01,800 --> 00:00:10,600
ANNOUNCER: You will hear two Theatre Studies students discussing stage and screen performances of Shakespeare's play Romeo and Juliet.

3
00:00:10,800 --> 00:00:16,000
ANNOUNCER: First, you have some time to look at questions 21 and 22.

4
00:00:26,400 --> 00:00:31,300
ANNOUNCER: Now listen carefully and answer questions 21 and 22.

5
00:00:34,800 --> 00:00:39,000
ED: Did you make notes while you were watching the performances of Romeo and Juliet, Gemma?

6
00:00:39,500 --> 00:00:40,200
GEMMA: Yes, I did.

7
00:00:40,900 --> 00:00:44,800
GEMMA: I found it quite hard though. I kept getting too involved in the play.

8
00:00:45,200 --> 00:00:45,700
ED: Me too.

9
00:00:46,300 --> 00:00:47,900
ED: I ended up not taking notes.

10
00:00:48,600 --> 00:00:50,700
GEMMA: I wrote down my impressions when I got home.

11
00:00:51,500 --> 00:00:55,300
GEMMA: Do you mind if I check a few things with you in case I've missed anything?

12
00:00:55,900 --> 00:00:58,700
GEMMA: And I've also got some questions about our assignment.

13
00:00:59,000 --> 00:00:59,500
ED: No.

14
00:01:00,200 --> 00:01:01,500
ED: It's good to talk things through.

15
00:01:02,200 --> 00:01:03,400
ED: I may have missed things too.

16
00:01:04,000 --> 00:01:04,600
GEMMA: Okay, great.

17
00:01:05,500 --> 00:01:10,700
GEMMA: So, first of all, I'm not sure how much information we should include in our reviews.

18
00:01:11,000 --> 00:01:11,400
ED: Right.

19
00:01:12,200 --> 00:01:20,200
ED: Well, I don't think we need to describe what happens, especially as Romeo and Juliet is one of Shakespeare's most well-known plays.

20
00:01:20,500 --> 00:01:22,200
GEMMA: Yeah, everyone knows the story.

21
00:01:23,300 --> 00:01:27,900
GEMMA: In an essay, we'd focus on the poetry and Shakespeare's use of imagery, etc.

22
00:01:28,500 --> 00:01:30,700
GEMMA: But that isn't really relevant in a review.

23
00:01:31,500 --> 00:01:35,400
GEMMA: We're supposed to focus on how effective this particular production is.

24
00:01:35,800 --> 00:01:36,200
ED: Hmm.

25
00:01:37,300 --> 00:01:40,400
ED: We should say what made it a success or a failure.

26
00:01:41,100 --> 00:01:45,600
ED: And part of that means talking about the emotional impact the performance had on us.

27
00:01:45,800 --> 00:01:46,700
ED: I think that's important.

28
00:01:47,000 --> 00:01:47,400
GEMMA: Yes.

29
00:01:48,100 --> 00:01:56,600
GEMMA: And we should definitely mention how well the director handled important bits of the play, like when Romeo climbs onto Juliet's balcony.

30
00:01:57,000 --> 00:01:59,400
ED: And the fight between Mercutio and Tybalt.

31
00:01:59,700 --> 00:02:00,000
GEMMA: Yes.

32
00:02:01,000 --> 00:02:09,400
GEMMA: It would also be interesting to mention the theater space and how the director used it, but I don't think we'll have space in 800 words.

33
00:02:09,700 --> 00:02:10,300
ED: No, okay.

34
00:02:11,500 --> 00:02:13,100
ED: That all sounds quite straightforward.

35
00:02:17,300 --> 00:02:23,400
ANNOUNCER: Before you hear the rest of the discussion, you have some time to look at questions 23 to 30.

36
00:03:13,900 --> 00:03:17,600
ANNOUNCER: Now listen and answer questions 23 to 30.

37
00:03:21,400 --> 00:03:24,400
GEMMA: So, what about the Emporium theater's production of the play?

38
00:03:25,000 --> 00:03:29,400
GEMMA: I thought some things worked really well, but there were some problems too.

39
00:03:29,800 --> 00:03:30,100
ED: Yeah.

40
00:03:31,100 --> 00:03:32,700
ED: What about the set, for example?

41
00:03:33,400 --> 00:03:35,900
GEMMA: I think it was visually really stunning.

42
00:03:36,600 --> 00:03:40,200
GEMMA: I'd say that was probably the most memorable thing about this production.

43
00:03:40,600 --> 00:03:41,200
ED: You're right.

44
00:03:41,800 --> 00:03:43,400
ED: The set design was really amazing.

45
00:03:44,200 --> 00:03:47,800
ED: But actually, I have seen similar ideas used in other productions.

46
00:03:48,300 --> 00:03:48,600
GEMMA: Hmm.

47
00:03:49,600 --> 00:03:50,600
GEMMA: What about the lighting?

48
00:03:51,100 --> 00:03:54,600
GEMMA: Some of the scenes were so dimly lit, it was quite hard to see.

49
00:03:55,000 --> 00:03:55,900
ED: I didn't dislike it.

50
00:03:57,100 --> 00:03:59,900
ED: It helped to change the mood of the quieter scenes.

51
00:04:00,400 --> 00:04:01,300
GEMMA: That's a good point.

52
00:04:02,200 --> 00:04:03,500
GEMMA: What did you think of the costumes?

53
00:04:04,400 --> 00:04:07,200
GEMMA: I was a bit surprised by the contemporary dress, I must say.

54
00:04:07,700 --> 00:04:08,000
ED: Yeah.

55
00:04:08,700 --> 00:04:11,900
ED: I think it worked well, but I'd assumed it would be more conventional.

56
00:04:12,300 --> 00:04:12,800
GEMMA: Me too.

57
00:04:13,700 --> 00:04:17,900
GEMMA: I liked the music at the beginning, and I thought the musicians were brilliant.

58
00:04:18,500 --> 00:04:24,000
GEMMA: But I thought they were wasted because the music didn't have much impact in Acts 2 and 3.

59
00:04:24,400 --> 00:04:25,400
ED: Yes, that was a shame.

60
00:04:26,400 --> 00:04:32,500
ED: One problem with this production was that the actors didn't deliver the lines that well. They were speaking too fast.

61
00:04:33,000 --> 00:04:34,000
GEMMA: It was a problem, I agree.

62
00:04:34,700 --> 00:04:39,900
GEMMA: But I thought it was because they weren't speaking loudly enough, especially at key points in the play.

63
00:04:40,500 --> 00:04:42,400
ED: I actually didn't have a problem with that.

64
00:04:43,400 --> 00:04:47,900
ED: It's been an interesting experience watching different versions of Romeo and Juliet, hasn't it?

65
00:04:48,300 --> 00:04:48,900
GEMMA: Definitely.

66
00:04:49,700 --> 00:04:52,600
GEMMA: It's made me realize how relevant the play still is.

67
00:04:52,900 --> 00:04:53,300
ED: Right.

68
00:04:53,900 --> 00:04:57,800
ED: I mean, a lot's changed since Shakespeare's time, but in many ways, nothing's changed.

69
00:04:58,300 --> 00:05:02,600
ED: There are always disagreements and tension between teenagers and their parents.

70
00:05:03,000 --> 00:05:06,200
GEMMA: Yes, that's something all young people can relate to.

71
00:05:07,000 --> 00:05:10,400
GEMMA: More than the violence and the extreme emotions in the play.

72
00:05:11,100 --> 00:05:13,300
ED: How did you find watching it in translation?

73
00:05:14,300 --> 00:05:15,100
GEMMA: Really interesting.

74
00:05:15,900 --> 00:05:20,200
GEMMA: I expected to find it more challenging, but I could follow the story pretty well.

75
00:05:20,800 --> 00:05:25,900
GEMMA: I stopped worrying about not being able to understand all the words and focused on the actor's expressions.

76
00:05:26,900 --> 00:05:27,900
GEMMA: The ending was pretty powerful.

77
00:05:28,400 --> 00:05:28,800
ED: Yes.

78
00:05:29,600 --> 00:05:32,400
ED: That somehow intensified the emotion for me.

79
00:05:33,100 --> 00:05:37,700
ED: Did you know Shakespeare's been translated into more languages than any other writer?

80
00:05:38,100 --> 00:05:38,400
GEMMA: Hmm.

81
00:05:39,600 --> 00:05:42,400
GEMMA: What's the reason for his international appeal, do you think?

82
00:05:43,300 --> 00:05:48,800
ED: I was reading that it's because his plays are about basic themes that people everywhere are familiar with.

83
00:05:49,200 --> 00:05:49,600
GEMMA: Yeah.

84
00:05:50,300 --> 00:05:52,600
GEMMA: And they can also be understood on different levels.

85
00:05:53,400 --> 00:05:55,000
GEMMA: The characters have such depth.

86
00:05:55,400 --> 00:05:55,800
ED: Right.

87
00:05:56,300 --> 00:05:59,700
ED: Which allows directors to experiment and find new angles.

88
00:06:00,200 --> 00:06:01,050
GEMMA: That's really important.

89
00:06:05,600 --> 00:06:07,300
ANNOUNCER: That is the end of part three.

90
00:06:08,200 --> 00:06:11,800
ANNOUNCER: You now have half a minute to check your answers to part three.
$srt_2022$::text),
        false
      )::text,
      updated_at = now()
  WHERE id = '0af3c2b9-2fdb-4caa-8410-ddd08774b029'::uuid
    AND test_type = 'listening'
    AND cambridge_year = 2022
    AND cambridge_test_number = 2
    AND jsonb_typeof(content::jsonb) = 'array'
    AND jsonb_array_length(content::jsonb) = 4;

  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  IF affected_rows <> 1 THEN
    RAISE EXCEPTION 'Expected one Cambridge 17 Test 2 Listening passage, updated %', affected_rows;
  END IF;
END
$migration$;
