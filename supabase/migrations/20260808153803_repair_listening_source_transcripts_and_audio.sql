-- Restore authoritative Listening audioscripts and source-image evidence metadata.
-- The Cambridge 18 Test 4 R2 objects were independently downloaded and verified
-- byte-for-byte against the supplied source URLs before these database references
-- were retained. This migration does not upload or delete R2 objects.

DO $migration$
DECLARE
  affected_rows integer;
BEGIN
  UPDATE public.passages
  SET content = jsonb_set(
        jsonb_set(
          jsonb_set(
            jsonb_set(
              jsonb_set(
                jsonb_set(
                  jsonb_set(
                    jsonb_set(content::jsonb, '{0,srt_content}', to_jsonb($srt_2023_1$
1
00:00:00,597 --> 00:00:01,249
ANNOUNCER: Part 1.

2
00:00:02,455 --> 00:00:08,156
ANNOUNCER: You will hear a man who works at an employment agency, phoning a woman who is looking for a job.

3
00:00:09,144 --> 00:00:12,767
ANNOUNCER: First, you have some time to look at questions 1 to 5.

4
00:00:38,016 --> 00:00:41,736
ANNOUNCER: Now listen carefully and answer questions 1 to 5.

5
00:00:45,300 --> 00:00:45,800
JULIE: Hello?

6
00:00:46,300 --> 00:00:48,000
GREG: Oh, hello. Is that Julie Davison?

7
00:00:48,700 --> 00:00:49,000
JULIE: Yes.

8
00:00:49,700 --> 00:00:57,200
GREG: This is Greg Preston from the Employment Agency. We met last week when you came in to enquire about office work.

9
00:00:57,600 --> 00:00:58,300
JULIE: Oh, that's right.

10
00:00:59,200 --> 00:01:03,700
GREG: Now we've just had some details come in of a job which might interest you.

11
00:01:04,200 --> 00:01:04,800
JULIE: OK.

12
00:01:05,500 --> 00:01:09,000
GREG: So this is a position for a receptionist.

13
00:01:10,200 --> 00:01:12,400
GREG: I believe you've done that sort of work before.

14
00:01:12,900 --> 00:01:19,000
JULIE: Yes, I have. I worked in a sports center for a couple of years before I got married and had the children.

15
00:01:19,600 --> 00:01:27,300
GREG: Right. Well, this job's in Fordham, so not too far away for you, and it's at the medical center there.

16
00:01:27,700 --> 00:01:30,000
JULIE: OK, so where exactly is that?

17
00:01:30,600 --> 00:01:33,900
GREG: It's quite near the station on Chastons Road.

18
00:01:34,500 --> 00:01:34,900
JULIE: Sorry?

19
00:01:35,600 --> 00:01:37,000
GREG: Chastons Road.

20
00:01:37,500 --> 00:01:46,000
GREG: That's C H A S T O N S.

21
00:01:46,700 --> 00:01:47,600
JULIE: OK, thanks.

22
00:01:48,000 --> 00:01:52,000
JULIE: So what would the work involve? Dealing with enquiries from patients?

23
00:01:52,500 --> 00:02:02,700
GREG: Yes. And you'd also be involved in making appointments, whether face to face or on the phone, and rescheduling them if necessary.

24
00:02:03,200 --> 00:02:04,800
JULIE: Fine. That shouldn't be a problem.

25
00:02:05,600 --> 00:02:10,900
GREG: And another of your duties would be keeping the center's database up-to-date.

26
00:02:11,600 --> 00:02:18,300
GREG: Then you might have other general administrative duties as well, but those would be the main ones.

27
00:02:18,800 --> 00:02:19,300
JULIE: OK.

28
00:02:23,200 --> 00:02:29,000
ANNOUNCER: Before you hear the rest of the conversation, you have some time to look at questions 6 to 10.

29
00:03:09,600 --> 00:03:12,200
ANNOUNCER: Now listen and answer questions 6 to 10.

30
00:03:16,300 --> 00:03:25,000
GREG: Now, when the details came in, I immediately thought of you, because one thing they do require is someone with experience.

31
00:03:25,700 --> 00:03:30,000
GREG: And you did mention your work at the sports center when you came in to see us.

32
00:03:30,600 --> 00:03:32,900
JULIE: Yes, in fact, I enjoyed that job.

33
00:03:33,600 --> 00:03:35,000
JULIE: Is there anything else they're looking for?

34
00:03:35,900 --> 00:03:49,000
GREG: Well, they say it's quite a high-pressure environment. They're always very busy, and patients are often under stress. So they want someone who can cope with that and stay calm, and at the same time, be confident when interacting with the public.

35
00:03:49,000 --> 00:04:01,000
JULIE: Well, after dealing with three children all under 5, I reckon I can cope with that. GREG: I'm sure you can. And then another thing they mention is that they're looking for someone with good IT skills...

36
00:04:10,500 --> 00:04:11,200
JULIE: Not a problem.

37
00:04:12,000 --> 00:04:14,000
GREG: So you'd be interested in following this up?

38
00:04:14,700 --> 00:04:15,100
JULIE: Sure.

39
00:04:15,600 --> 00:04:16,600
JULIE: When would it start?

40
00:04:17,300 --> 00:04:20,800
GREG: Well, they're looking for someone from the beginning of next month.

41
00:04:21,400 --> 00:04:34,800
GREG: But I should tell you that this isn't a permanent job, it's temporary, so the contract would be just to the end of September, but they do say that there could be further opportunities after that.

42
00:04:35,300 --> 00:04:37,600
JULIE: OK, and what would the hours be?

43
00:04:38,300 --> 00:04:43,600
GREG: Well, they want someone who can start at a quarter to eight in the morning. Could you manage that?

44
00:04:44,500 --> 00:04:51,500
JULIE: Yes, my husband would have to get the kids up and off to my mother's. She's going to be looking after them while I'm at work.

45
00:04:52,200 --> 00:04:53,500
JULIE: What time would I finish?

46
00:04:54,200 --> 00:04:54,800
GREG: 1:15.

47
00:04:55,500 --> 00:04:56,800
JULIE: That should work out all right.

48
00:04:57,500 --> 00:05:01,500
JULIE: I can pick the kids up on my way home, and then I'll have the afternoon with them.

49
00:05:02,000 --> 00:05:02,600
JULIE: Oh, one thing.

50
00:05:03,400 --> 00:05:06,400
JULIE: Is there parking available for staff at the center?

51
00:05:06,900 --> 00:05:08,200
GREG: Yes, there is.

52
00:05:08,600 --> 00:05:10,000
GREG: And it's also on a bus route.

53
00:05:10,700 --> 00:05:11,000
JULIE: Right.

54
00:05:11,600 --> 00:05:14,400
JULIE: Well, I expect I'll have the car, but it's good to know that.

55
00:05:15,000 --> 00:05:17,300
JULIE: OK, so where do I go from here?

56
00:05:18,200 --> 00:05:31,100
GREG: Well, if you're happy for me to do so, I'll forward your CV and references, and then the best thing would probably be for you to phone them, so they can arrange for an interview.

57
00:05:31,700 --> 00:05:33,500
JULIE: Great. Well, thank you very much.

58
00:05:33,900 --> 00:05:34,600
GREG: You're welcome.

59
00:05:35,200 --> 00:05:36,000
JULIE: Bye now. Bye.

60
00:05:39,600 --> 00:05:41,200
ANNOUNCER: That is the end of part 1.

61
00:05:42,200 --> 00:05:45,700
ANNOUNCER: You now have one minute to check your answers to part 1.
$srt_2023_1$::text), false),
                    '{1,srt_content}', to_jsonb($srt_2023_2$
1
00:00:00,000 --> 00:00:01,019
ANNOUNCER: Part 2.

2
00:00:01,999 --> 00:00:06,369
ANNOUNCER: You will hear a guide at a farming museum talking to a group of visitors.

3
00:00:07,371 --> 00:00:11,524
ANNOUNCER: First, you have some time to look at questions 11 to 14.

4
00:00:41,978 --> 00:00:46,188
ANNOUNCER: Now listen carefully and answer questions 11 to 14.

5
00:00:49,940 --> 00:01:06,500
GUIDE: Good morning everyone, and welcome to the Museum of Farming Life. I understand it's your first visit here, so I'd like to give you some background information about the museum, and then explain a little about what you can see during your visit.

6
00:01:07,500 --> 00:01:21,700
GUIDE: So, where we're standing at the moment is the entrance to a large building that was constructed in 1880, as the home of a local businessman, Alfred Palmer of the Palmer Biscuit Factory.

7
00:01:22,660 --> 00:01:31,800
GUIDE: It was later sold, and became a hall of residence for students in 1911, and a museum in 1951.

8
00:01:32,900 --> 00:01:39,400
GUIDE: In 2005, a modern extension was built to accommodate the museum's collections.

9
00:01:40,800 --> 00:01:58,400
GUIDE: The museum's owned by the university, and apart from two rooms that are our offices, the university uses the main part of the building. You may see students going into the building for lessons, but it's not open to museum visitors, I'm afraid.

10
00:01:59,200 --> 00:02:07,700
GUIDE: It's a shame, because the interior architectural features are outstanding, especially the room that used to be the library.

11
00:02:08,900 --> 00:02:13,100
GUIDE: Luckily, we've managed to keep entry to the museum free.

12
00:02:14,200 --> 00:02:21,100
GUIDE: This includes access to all the galleries, outdoor areas, and the rooms for special exhibitions.

13
00:02:21,900 --> 00:02:29,800
GUIDE: We run activities for children and students, such as the Museum Club, for which there's no charge.

14
00:02:30,500 --> 00:02:38,700
GUIDE: We do have a donation box just over there, so feel free to give whatever amount you consider appropriate.

15
00:02:39,700 --> 00:02:44,800
GUIDE: We do have a cloakroom, if you'd like to leave your coats and bags somewhere.

16
00:02:46,000 --> 00:02:53,400
GUIDE: Unlike other museums, photography is allowed here, so you might like to keep your cameras with you.

17
00:02:54,500 --> 00:03:04,100
GUIDE: You might be more comfortable not carrying around heavy rucksacks, though keep your coats and jackets on, as it's quite cold in the museum garden today.

18
00:03:07,600 --> 00:03:13,500
ANNOUNCER: Before you hear the rest of the talk, you have some time to look at questions 15 to 20.

19
00:03:44,000 --> 00:03:47,500
ANNOUNCER: Now listen and answer questions 15 to 20.

20
00:03:51,400 --> 00:03:54,700
GUIDE: I'd like to tell you about the different areas of the museum.

21
00:03:56,000 --> 00:04:02,300
GUIDE: Just inside and outside the main gallery, we have an area called Four Seasons.

22
00:04:03,200 --> 00:04:07,300
GUIDE: Here, you can watch a four-minute animation of a woodland scene.

23
00:04:08,100 --> 00:04:14,900
GUIDE: It was designed especially for the museum by a group of young people on a film studies course, and it's beautiful.

24
00:04:15,600 --> 00:04:18,900
GUIDE: Children absolutely love it, but then so do adults.

25
00:04:20,000 --> 00:04:23,100
GUIDE: The main gallery's called Town and Country.

26
00:04:24,100 --> 00:04:28,800
GUIDE: It includes a photographic collection of prize-winning sheep and shepherds.

27
00:04:29,900 --> 00:04:36,300
GUIDE: Leaving Town and Country, you enter Farmhouse Kitchen, which is, well, self-explanatory.

28
00:04:37,300 --> 00:04:43,400
GUIDE: Here we have the oldest collection of equipment for making butter and cheese in the country.

29
00:04:44,100 --> 00:04:51,700
GUIDE: And this morning, a specialist cheesemaker will be giving demonstrations of how it's produced. You may even get to try some.

30
00:04:53,000 --> 00:04:56,500
GUIDE: After that, you can go in two directions.

31
00:04:57,400 --> 00:05:04,400
GUIDE: To the right is a staircase that takes you up to a landing, from where you can look down on the galleries.

32
00:05:05,200 --> 00:05:08,800
GUIDE: To the left is a room called A Year on the Farm.

33
00:05:09,800 --> 00:05:16,700
GUIDE: There is lots of seating here, as sometimes we use the room for school visits, so it's a good place to stop for a rest.

34
00:05:17,900 --> 00:05:25,900
GUIDE: If you're feeling competitive, you can take our memory test, in which you answer questions about things you've seen in the museum.

35
00:05:27,100 --> 00:05:29,100
GUIDE: The next area is called Wagon Walk.

36
00:05:30,200 --> 00:05:34,700
GUIDE: This contains farm carts from nearly every part of the country.

37
00:05:35,600 --> 00:05:38,700
GUIDE: It's surprising how much regional variation there was.

38
00:05:40,000 --> 00:05:44,200
GUIDE: Beside the carts are display boards with information about each one.

39
00:05:45,300 --> 00:05:53,800
GUIDE: The carts are old and fragile, so we ask you to keep your children close to you, and ensure they don't climb on the carts.

40
00:05:55,000 --> 00:06:05,100
GUIDE: From Wagon Walk, you can either make your way back to reception, or go out into the garden, or even go back to take another look in the galleries.

41
00:06:06,100 --> 00:06:14,200
GUIDE: In the far corner of the garden is Bees are Magic, but we're redeveloping this area, so you can't visit that at the moment.

42
00:06:14,700 --> 00:06:17,400
GUIDE: You can still buy our honey in the shop though.

43
00:06:18,500 --> 00:06:24,100
GUIDE: Finally, there is the pond, which contains all kinds of interesting wildlife.

44
00:06:25,000 --> 00:06:29,900
GUIDE: There are baby ducks that are only a few days old, as well as tiny frogs.

45
00:06:30,800 --> 00:06:36,500
GUIDE: The pond isn't deep, and there is a fence around it, so it's perfectly safe for children.

46
00:06:39,900 --> 00:06:41,300
ANNOUNCER: That is the end of part 2.

47
00:06:42,100 --> 00:06:45,600
ANNOUNCER: You now have 30 seconds to check your answers to part 2.
$srt_2023_2$::text), false
                  ),
                  '{2,srt_content}', to_jsonb($srt_2023_3$
1
00:00:00,378 --> 00:00:01,110
ANNOUNCER: Part 3.

2
00:00:02,190 --> 00:00:12,223
ANNOUNCER: Following instructions from their tutor, you will hear two trainee teachers discussing the use of origami, a paper folding activity in the classroom.

3
00:00:13,532 --> 00:00:17,979
ANNOUNCER: First, you have some time to look at questions 21 to 27.

4
00:00:53,158 --> 00:00:57,806
ANNOUNCER: Now listen carefully and answer questions 21 to 27.

5
00:01:01,600 --> 00:01:14,600
TUTOR: So now I want you to discuss the lesson we've just been watching on the video, and think about the ways in which origami can be a useful educational tool. Can you all work with the person sitting next to you?

6
00:01:16,100 --> 00:01:27,300
SEB: I had no idea that such a simple thing like folding squares of paper to make the shape of something like a bird could be such an amazing tool. It's made me see origami in a whole new light.

7
00:01:27,600 --> 00:01:41,600
LIA: I know. It was interesting to see the educational skills the children were developing by doing origami. On the video you could see them really listening hard to make sure they did all the steps in the right order to make the bird.

8
00:01:41,800 --> 00:01:56,700
SEB: That's right. In this lesson, they were working individually, but it would also be interesting to see if the children could work out how to make something simple, uh, without being given any direction. That would help with building teamwork as well.

9
00:01:57,100 --> 00:01:59,600
LIA: Yes, but much more of a challenge.

10
00:02:00,400 --> 00:02:06,500
LIA: One thing that really stood out for me was that the children were all having fun while being taught something new.

11
00:02:06,700 --> 00:02:18,800
SEB: Which is a key aim of any lesson with this age group. And although these kids had no problems with folding the paper, with younger children you could do origami to help practice fine motor skills.

12
00:02:19,200 --> 00:02:19,900
LIA: Absolutely.

13
00:02:20,900 --> 00:02:28,400
LIA: Shall we talk about the individual children we saw on the video? I wrote all their names down and took some notes.

14
00:02:28,600 --> 00:02:29,400
SEB: Yes, I did too.

15
00:02:30,200 --> 00:02:31,100
LIA: OK, good.

16
00:02:31,800 --> 00:02:33,300
LIA: Let's start with Sid.

17
00:02:34,000 --> 00:02:39,900
SEB: He was interesting, because before they started doing the origami, he was being quite disruptive.

18
00:02:40,500 --> 00:02:48,200
LIA: Yes, he really benefited from having to use his hands. It helped him to settle down and start concentrating.

19
00:02:48,600 --> 00:02:50,100
SEB: Yes, I noticed that too.

20
00:02:50,800 --> 00:02:52,500
SEB: What about Jack?

21
00:02:53,300 --> 00:02:56,600
SEB: I noticed he seemed to want to work things out for himself.

22
00:02:57,200 --> 00:03:02,400
LIA: Hmm. You could see him trying out different things rather than asking the teacher for help.

23
00:03:03,300 --> 00:03:05,100
LIA: What did you make of Naomi?

24
00:03:05,800 --> 00:03:14,700
SEB: She seemed to be losing interest at one point, but then she decided she wanted her mouse to be the best, and that motivated her to try harder.

25
00:03:15,200 --> 00:03:18,200
LIA: She didn't seem satisfied with hers in the end, though.

26
00:03:18,600 --> 00:03:18,900
SEB: No.

27
00:03:20,300 --> 00:03:21,900
LIA: Anya was such a star.

28
00:03:22,700 --> 00:03:29,200
LIA: She listened so carefully, and then produced the perfect bird with very little effort.

29
00:03:29,600 --> 00:03:33,900
SEB: Hmm, I think the teacher could have increased the level of difficulty for her.

30
00:03:34,400 --> 00:03:35,100
LIA: Hmm, maybe.

31
00:03:36,200 --> 00:03:39,800
LIA: I think it was the first time Zara had come across origami.

32
00:03:40,400 --> 00:03:42,900
SEB: She looked as if she didn't really get what was going on.

33
00:03:43,500 --> 00:03:46,200
LIA: She seemed unsure about what she was supposed to do.

34
00:03:47,100 --> 00:03:49,500
LIA: But in the end, hers didn't turn out too badly.

35
00:03:50,000 --> 00:03:53,400
SEB: Yeah, I'm sure it was a positive learning experience for her.

36
00:03:53,800 --> 00:03:54,100
LIA: Hmm.

37
00:03:57,400 --> 00:04:04,100
ANNOUNCER: Before you hear the rest of the discussion, you have some time to look at questions 28 to 30.

38
00:04:29,361 --> 00:04:32,941
ANNOUNCER: Now listen and answer questions 28 to 30.

39
00:04:36,400 --> 00:04:43,700
LIA: I think one reason why the origami activity worked so well in this class was that the teacher was well prepared.

40
00:04:44,200 --> 00:04:51,500
SEB: Right. I think it would have taken me ages to prepare examples showing each of the steps involved in making the bird.

41
00:04:51,900 --> 00:04:56,500
SEB: But that was a really good idea. The children could see what they were aiming for.

42
00:04:57,100 --> 00:05:02,100
SEB: And much better for them to be able to hold something, rather than just looking at pictures.

43
00:05:02,600 --> 00:05:07,100
LIA: Hmm, those physical examples supported her verbal explanations really well.

44
00:05:07,700 --> 00:05:10,900
SEB: It's strange that origami isn't used more widely.

45
00:05:11,300 --> 00:05:12,600
SEB: Why do you think that is?

46
00:05:13,400 --> 00:05:22,700
LIA: Well, teachers may just feel it's not that appealing to children who are used to doing everything on computers, especially boys, even if they're aware of the benefits.

47
00:05:23,200 --> 00:05:26,700
SEB: Oh, I don't know. It's no different to any other craft activity.

48
00:05:27,600 --> 00:05:31,300
SEB: I bet it's because so many teachers are clumsy like me.

49
00:05:31,900 --> 00:05:35,800
LIA: That's true. Too much effort required if you're not good with your hands.

50
00:05:36,400 --> 00:05:42,100
SEB: Well, anyway, I think we should try it out in our maths teaching practice with year three.

51
00:05:42,800 --> 00:05:51,600
SEB: I can see using origami is a really engaging way of reinforcing children's knowledge of geometric shapes, like they were doing in the video.

52
00:05:52,300 --> 00:05:58,500
SEB: But I think it would also work really well for presenting fractions, which is coming up soon.

53
00:05:59,000 --> 00:05:59,700
LIA: Good idea.

54
00:06:00,300 --> 00:06:03,400
LIA: That's something most of the kids in that class might struggle with.

55
00:06:04,300 --> 00:06:09,500
LIA: Origami would also be good practice for using symmetry, but I think they did that last term.

56
00:06:10,100 --> 00:06:15,200
SEB: OK. Well, let's try and get some ideas together, and plan the lesson next week.

57
00:06:16,100 --> 00:06:18,100
TUTOR: OK, if you could all stop...

58
00:06:21,600 --> 00:06:23,100
ANNOUNCER: That is the end of part 3.

59
00:06:23,900 --> 00:06:27,500
ANNOUNCER: You now have 30 seconds to check your answers to part 3.
$srt_2023_3$::text), false
                ),
                '{3,srt_content}', to_jsonb($srt_2023_4$
1
00:00:00,000 --> 00:00:01,042
ANNOUNCER: Part 4.

2
00:00:01,817 --> 00:00:08,711
ANNOUNCER: You will hear a literature student giving a talk about Victor Hugo, a famous 19th century French writer.

3
00:00:09,678 --> 00:00:13,997
ANNOUNCER: First, you have some time to look at questions 31 to 40.

4
00:01:04,494 --> 00:01:08,840
ANNOUNCER: Now listen carefully and answer questions 31 to 40.

5
00:01:12,600 --> 00:01:17,600
STUDENT: The person I've chosen to talk about is the French writer Victor Hugo.

6
00:01:18,200 --> 00:01:26,900
STUDENT: Many people have heard of him because his novel, Les Miserables, which he wrote in 1862, is famous around the world.

7
00:01:28,200 --> 00:01:35,400
STUDENT: It became a stage musical in the 1980s, and a film version was also released in 2012.

8
00:01:36,100 --> 00:01:43,600
STUDENT: So, some of us, I'm sure, have a pretty general idea of the plot, but we know much less about the author.

9
00:01:44,700 --> 00:01:56,300
STUDENT: Today, I'm going to provide a little more insight into this talented man, and I'm going to talk particularly about the home he had on the island of Guernsey in the British Channel Islands.

10
00:01:57,300 --> 00:02:00,100
STUDENT: But first, his early career.

11
00:02:00,600 --> 00:02:08,800
STUDENT: As I've said, he was a writer, he was at the height of his career in Paris, and he was very highly regarded by his colleagues.

12
00:02:09,900 --> 00:02:14,900
STUDENT: As far as literature was concerned, he was the leading figure of the Romantic movement.

13
00:02:15,900 --> 00:02:25,100
STUDENT: However, as well as being a literary genius, he also gave many speeches about issues like the level of poverty in his society.

14
00:02:26,100 --> 00:02:33,500
STUDENT: He felt very strongly about this, and about other areas where change was needed, like education.

15
00:02:34,700 --> 00:02:48,200
STUDENT: This kind of outspoken criticism was not well liked by the rulers of France, and eventually the emperor - Napoleon III - told Victor Hugo to leave Paris and not return.

16
00:02:48,700 --> 00:02:51,600
STUDENT: In other words, he sent him into exile.

17
00:02:52,700 --> 00:02:57,400
STUDENT: So, Victor Hugo was forced to reside in other parts of Europe.

18
00:02:58,600 --> 00:03:04,600
STUDENT: Guernsey was actually his third place of exile, and he landed there in 1855.

19
00:03:06,200 --> 00:03:10,400
STUDENT: He produced a lot while on Guernsey, including Les Miserables.

20
00:03:11,200 --> 00:03:16,000
STUDENT: And to do this, he had to spend a great deal of time in the home that he had there.

21
00:03:17,200 --> 00:03:24,000
STUDENT: This was a property that he bought using the money he'd made in France, from the publication of a collection of his poetry.

22
00:03:24,800 --> 00:03:29,400
STUDENT: It was the only property he ever owned, and he was very proud of it.

23
00:03:34,700 --> 00:03:50,500
STUDENT: The property Victor Hugo bought on Guernsey was a large five-storey house in the capital town of St Peter Port, and he lived there for 15 years, returning to France in 1870 when Napoleon's empire collapsed.

24
00:03:51,300 --> 00:03:58,000
STUDENT: He decorated and furnished each level or floor of the house in unique and wonderful ways.

25
00:03:58,700 --> 00:04:03,600
STUDENT: And many people consider the inside of the house to be a work of art.

26
00:04:04,600 --> 00:04:10,200
STUDENT: Today, it's a museum that attracts 200,000 visitors a year.

27
00:04:11,500 --> 00:04:24,600
STUDENT: He lived in the house with his family, and portraits of its members still hang in rooms on the ground floor, along with drawings that he did during his travels, that he felt were important to him.

28
00:04:26,300 --> 00:04:32,600
STUDENT: In other ground floor rooms, there are huge tapestries that he would have designed and loved.

29
00:04:33,600 --> 00:04:42,000
STUDENT: The walls are covered in dark wood panelling that Victor Hugo created himself using wooden furniture that he bought in the market.

30
00:04:42,800 --> 00:04:48,900
STUDENT: The items were relatively inexpensive, and he used them to create intricate carvings.

31
00:04:50,000 --> 00:04:55,300
STUDENT: They gave an atmosphere on the lower level that was shadowy, and rather solemn.

32
00:04:56,600 --> 00:05:03,300
STUDENT: On the next level of the house, there are two impressive lounges where he entertained his guests.

33
00:05:04,400 --> 00:05:12,800
STUDENT: One lounge has entirely red furnishings, such as sofas and wall coverings, and the other blue.

34
00:05:13,800 --> 00:05:25,300
STUDENT: There's a strong Chinese influence in these areas, in things like the wallpaper pattern, and the lamps, which he would have made himself by copying original versions.

35
00:05:27,500 --> 00:05:38,900
STUDENT: His library, where he left many of his favorite books, forms the hallway to the third floor, and was a comfortable area where he could relax and enjoy his afternoons.

36
00:05:40,200 --> 00:05:48,700
STUDENT: And then, at the very top of the house, there's a room called the Lookout, called that because it looks out over the harbor.

37
00:05:50,100 --> 00:05:59,400
STUDENT: In contrast to the rather dark lower levels, it's full of light, and was like a glass office where he would write until lunchtime.

38
00:06:00,000 --> 00:06:01,400
STUDENT: Often at his desk.

39
00:06:02,600 --> 00:06:09,300
STUDENT: So, Victor Hugo was a man of many talents, but he was also true to his values.

40
00:06:10,300 --> 00:06:15,300
STUDENT: While living in his house on Guernsey, he entertained many other famous writers.

41
00:06:16,000 --> 00:06:23,500
STUDENT: But he also invited a large group of local children from the deprived areas of the island to dinner once a week.

42
00:06:24,600 --> 00:06:31,300
STUDENT: What's more, he served them their food, which was an extraordinary gesture for the time period.

43
00:06:32,900 --> 00:06:40,900
STUDENT: In 1927, the house was owned by his relatives, and they decided to donate it to the city of Paris.

44
00:06:42,500 --> 00:06:52,500
STUDENT: It has since been restored using photographs from the period, and, as I mentioned earlier, is now a museum that is open to the public.

45
00:06:56,200 --> 00:06:57,400
ANNOUNCER: That is the end of part 4.

46
00:06:58,300 --> 00:07:02,000
ANNOUNCER: You now have one minute to check your answers to part 4.
$srt_2023_4$::text), false
              ),
              '{0,audio_url}', to_jsonb('https://media.ieltsai.pro/listening/c18-t4/part-1.mp3?v=20260808153803'::text), false
            ),
            '{1,audio_url}', to_jsonb('https://media.ieltsai.pro/listening/c18-t4/part-2.mp3?v=20260808153803'::text), false
          ),
          '{2,audio_url}', to_jsonb('https://media.ieltsai.pro/listening/c18-t4/part-3.mp3?v=20260808153803'::text), false
        ),
        '{3,audio_url}', to_jsonb('https://media.ieltsai.pro/listening/c18-t4/part-4.mp3?v=20260808153803'::text), false
      )::text,
      audio_url = 'https://media.ieltsai.pro/listening/c18-t4/part-1.mp3?v=20260808153803',
      updated_at = now()
  WHERE id = 'ba9a7edc-23c9-4d06-aaa0-624a7724a729'::uuid
    AND test_type = 'listening'
    AND cambridge_year = 2023
    AND cambridge_test_number = 4
    AND jsonb_typeof(content::jsonb) = 'array'
    AND jsonb_array_length(content::jsonb) = 4;

  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  IF affected_rows <> 1 THEN
    RAISE EXCEPTION 'Expected one Cambridge 18 Test 4 Listening passage, updated %', affected_rows;
  END IF;

  UPDATE public.passages
  SET content = jsonb_set(
        jsonb_set(
          jsonb_set(content::jsonb, '{2,srt_content}', to_jsonb($srt_2026_3$
1
00:00:00,000 --> 00:00:01,000
ANNOUNCER: Part three.

2
00:00:01,900 --> 00:00:09,950
ANNOUNCER: You will hear two architecture students called Mia and Leo discussing their presentation on houses of the future.

3
00:00:11,900 --> 00:00:16,300
ANNOUNCER: First, you have some time to look at questions 21 to 23.

4
00:00:41,650 --> 00:00:46,730
ANNOUNCER: Now listen carefully and answer questions 21 to 23.

5
00:00:50,200 --> 00:00:53,500
MIA: You know that joint presentation we've got to do this semester, Leo?

6
00:00:54,100 --> 00:00:55,490
LEO: On houses of the future.

7
00:00:55,900 --> 00:00:56,590
MIA: That's right.

8
00:00:57,200 --> 00:01:02,300
MIA: I'm a bit concerned, are we meant to come up with creative new suggestions for these houses?

9
00:01:02,900 --> 00:01:08,500
LEO: I don't think so, it's more a matter of reporting and evaluating possible developments.

10
00:01:08,900 --> 00:01:14,990
LEO: But we mustn't be too general, we've got to support our points by referring to specific cases.

11
00:01:15,460 --> 00:01:17,100
LEO: So that'll need a lot of work.

12
00:01:17,600 --> 00:01:18,790
MIA: Hmm, I'm afraid so.

13
00:01:19,700 --> 00:01:21,200
MIA: When's it got to be done by?

14
00:01:21,800 --> 00:01:25,500
LEO: In about six weeks, so that's not too much of a rush.

15
00:01:25,900 --> 00:01:26,290
MIA: Good.

16
00:01:26,900 --> 00:01:30,990
MIA: We'd better decide now what type of housing we're going to focus on.

17
00:01:31,500 --> 00:01:34,900
LEO: How about housing for different generations living together?

18
00:01:35,500 --> 00:01:36,300
MIA: Hmm, we could do.

19
00:01:37,100 --> 00:01:38,900
MIA: Or accommodation for one person?

20
00:01:39,500 --> 00:01:41,100
LEO: I think someone else is doing that.

21
00:01:41,500 --> 00:01:41,700
MIA: Ah.

22
00:01:42,400 --> 00:01:44,700
LEO: I was wondering about housing for the elderly.

23
00:01:45,100 --> 00:01:47,300
LEO: That's likely to become more important.

24
00:01:47,800 --> 00:01:48,700
MIA: Yeah, that's true.

25
00:01:49,700 --> 00:01:53,800
MIA: But I think your suggestion about intergenerational living might be more interesting.

26
00:01:54,300 --> 00:01:55,000
MIA: Let's go with that.

27
00:01:55,500 --> 00:01:55,800
LEO: Okay.

28
00:01:56,700 --> 00:02:02,200
LEO: Now, I think the future demand is mainly going to be for accommodation in urban areas.

29
00:02:02,700 --> 00:02:10,600
LEO: So, one way of meeting that demand might be to use existing commercial buildings and adapt them to form accommodation.

30
00:02:11,100 --> 00:02:16,700
MIA: Hmm, or come up with original ways of organizing space so that people can live in smaller homes.

31
00:02:17,600 --> 00:02:21,400
MIA: But I think the solution is to design multi-story apartment blocks.

32
00:02:21,900 --> 00:02:24,200
LEO: Building up rather than out, yes.

33
00:02:27,900 --> 00:02:34,900
ANNOUNCER: Before you hear the rest of the discussion, you have some time to look at questions 24 to 30.

34
00:03:10,200 --> 00:03:14,300
ANNOUNCER: Now listen and answer questions 24 to 30.

35
00:03:17,700 --> 00:03:21,700
MIA: Let's think of some specific developments for houses of the future.

36
00:03:22,400 --> 00:03:27,700
LEO: Okay, how about increased use of roof space on high-rise buildings for gardens?

37
00:03:28,200 --> 00:03:28,500
MIA: Yes.

38
00:03:29,300 --> 00:03:34,900
MIA: In fact, it doesn't have to be high-rise, you can do it on a one-story building in a suburb.

39
00:03:35,500 --> 00:03:39,400
MIA: But it would greatly improve how you feel if you live in an urban high-rise.

40
00:03:39,900 --> 00:03:41,600
LEO: Especially if you don't have a balcony.

41
00:03:42,200 --> 00:03:42,500
MIA: Yes.

42
00:03:43,400 --> 00:03:47,900
MIA: I think homes of the future will all need access to a shared working space.

43
00:03:48,500 --> 00:03:56,100
MIA: Somewhere in the same building or a group of houses where people can go and work instead of just having a laptop on the kitchen table.

44
00:03:56,700 --> 00:04:01,500
LEO: Yes, so they aren't having to travel to an office but can still interact with others.

45
00:04:01,900 --> 00:04:02,100
MIA: Hmm.

46
00:04:02,500 --> 00:04:07,100
LEO: That's often how new ideas get generated by chatting to someone from a different profession.

47
00:04:07,700 --> 00:04:08,000
MIA: Yeah.

48
00:04:08,800 --> 00:04:17,900
MIA: I read about a type of design where the internal walls of an apartment are movable, so the space can be adapted over time as people's needs change.

49
00:04:18,500 --> 00:04:24,200
LEO: Like when children leave school and start working but still continue to live with their parents for many years.

50
00:04:24,600 --> 00:04:27,100
LEO: Or when an elderly relative moves in with the family.

51
00:04:27,700 --> 00:04:32,200
LEO: It would mean they could still have their own space, specially designed for their needs.

52
00:04:32,700 --> 00:04:33,000
MIA: Yes.

53
00:04:33,800 --> 00:04:38,400
MIA: Have you heard about those smart bathroom mirrors which can monitor people's health?

54
00:04:38,900 --> 00:04:42,900
MIA: They recognize signs of illness and contact a doctor automatically.

55
00:04:43,500 --> 00:04:43,800
LEO: Hmm.

56
00:04:44,400 --> 00:04:46,100
LEO: Not so sure they're a good idea.

57
00:04:46,700 --> 00:04:47,200
MIA: Nor am I.

58
00:04:47,900 --> 00:04:50,900
MIA: People might worry about conditions which aren't serious at all.

59
00:04:51,400 --> 00:04:52,300
LEO: What about transport?

60
00:04:53,500 --> 00:05:02,900
LEO: Wouldn't it be good if there were bike sheds with charging points so people could store their electric bikes securely and charge them up at the same time?

61
00:05:03,300 --> 00:05:03,600
MIA: Yes.

62
00:05:04,300 --> 00:05:07,800
MIA: That would encourage more people to cycle instead of using their car.

63
00:05:08,500 --> 00:05:09,900
MIA: Much better for the planet.

64
00:05:10,300 --> 00:05:10,600
LEO: Hmm.

65
00:05:10,900 --> 00:05:18,600
LEO: I read about one housing development where cars had to be left just outside it, so the center was all a pedestrianized area.

66
00:05:18,900 --> 00:05:20,500
LEO: Great for families with children.

67
00:05:21,000 --> 00:05:21,400
MIA: Maybe.

68
00:05:22,100 --> 00:05:25,100
MIA: But what if you're disabled or elderly and can't walk far?

69
00:05:25,700 --> 00:05:27,700
MIA: It wouldn't be so good for people like that.

70
00:05:28,100 --> 00:05:28,400
LEO: No.

71
00:05:29,300 --> 00:05:34,700
MIA: I saw a scheme for communal vegetable plots where neighbors could decide what to grow together.

72
00:05:35,400 --> 00:05:41,400
MIA: That would be a great way for older people to get to know one another, especially if they're no longer going out to work.

73
00:05:41,900 --> 00:05:45,800
LEO: Yes, doing something together is always more enjoyable, isn't it?

74
00:05:46,300 --> 00:05:47,900
LEO: Do you think we might be able to look into that?

75
00:05:52,200 --> 00:05:53,600
ANNOUNCER: That is the end of part three.

76
00:05:55,400 --> 00:05:59,700
ANNOUNCER: You now have 30 seconds to check your answers to part three.
$srt_2026_3$::text), false),
          '{2,transcript}', to_jsonb($srt_2026_3_copy$
1
00:00:00,000 --> 00:00:01,000
ANNOUNCER: Part three.

2
00:00:01,900 --> 00:00:09,950
ANNOUNCER: You will hear two architecture students called Mia and Leo discussing their presentation on houses of the future.

3
00:00:11,900 --> 00:00:16,300
ANNOUNCER: First, you have some time to look at questions 21 to 23.

4
00:00:41,650 --> 00:00:46,730
ANNOUNCER: Now listen carefully and answer questions 21 to 23.

5
00:00:50,200 --> 00:00:53,500
MIA: You know that joint presentation we've got to do this semester, Leo?

6
00:00:54,100 --> 00:00:55,490
LEO: On houses of the future.

7
00:00:55,900 --> 00:00:56,590
MIA: That's right.

8
00:00:57,200 --> 00:01:02,300
MIA: I'm a bit concerned, are we meant to come up with creative new suggestions for these houses?

9
00:01:02,900 --> 00:01:08,500
LEO: I don't think so, it's more a matter of reporting and evaluating possible developments.

10
00:01:08,900 --> 00:01:14,990
LEO: But we mustn't be too general, we've got to support our points by referring to specific cases.

11
00:01:15,460 --> 00:01:17,100
LEO: So that'll need a lot of work.

12
00:01:17,600 --> 00:01:18,790
MIA: Hmm, I'm afraid so.

13
00:01:19,700 --> 00:01:21,200
MIA: When's it got to be done by?

14
00:01:21,800 --> 00:01:25,500
LEO: In about six weeks, so that's not too much of a rush.

15
00:01:25,900 --> 00:01:26,290
MIA: Good.

16
00:01:26,900 --> 00:01:30,990
MIA: We'd better decide now what type of housing we're going to focus on.

17
00:01:31,500 --> 00:01:34,900
LEO: How about housing for different generations living together?

18
00:01:35,500 --> 00:01:36,300
MIA: Hmm, we could do.

19
00:01:37,100 --> 00:01:38,900
MIA: Or accommodation for one person?

20
00:01:39,500 --> 00:01:41,100
LEO: I think someone else is doing that.

21
00:01:41,500 --> 00:01:41,700
MIA: Ah.

22
00:01:42,400 --> 00:01:44,700
LEO: I was wondering about housing for the elderly.

23
00:01:45,100 --> 00:01:47,300
LEO: That's likely to become more important.

24
00:01:47,800 --> 00:01:48,700
MIA: Yeah, that's true.

25
00:01:49,700 --> 00:01:53,800
MIA: But I think your suggestion about intergenerational living might be more interesting.

26
00:01:54,300 --> 00:01:55,000
MIA: Let's go with that.

27
00:01:55,500 --> 00:01:55,800
LEO: Okay.

28
00:01:56,700 --> 00:02:02,200
LEO: Now, I think the future demand is mainly going to be for accommodation in urban areas.

29
00:02:02,700 --> 00:02:10,600
LEO: So, one way of meeting that demand might be to use existing commercial buildings and adapt them to form accommodation.

30
00:02:11,100 --> 00:02:16,700
MIA: Hmm, or come up with original ways of organizing space so that people can live in smaller homes.

31
00:02:17,600 --> 00:02:21,400
MIA: But I think the solution is to design multi-story apartment blocks.

32
00:02:21,900 --> 00:02:24,200
LEO: Building up rather than out, yes.

33
00:02:27,900 --> 00:02:34,900
ANNOUNCER: Before you hear the rest of the discussion, you have some time to look at questions 24 to 30.

34
00:03:10,200 --> 00:03:14,300
ANNOUNCER: Now listen and answer questions 24 to 30.

35
00:03:17,700 --> 00:03:21,700
MIA: Let's think of some specific developments for houses of the future.

36
00:03:22,400 --> 00:03:27,700
LEO: Okay, how about increased use of roof space on high-rise buildings for gardens?

37
00:03:28,200 --> 00:03:28,500
MIA: Yes.

38
00:03:29,300 --> 00:03:34,900
MIA: In fact, it doesn't have to be high-rise, you can do it on a one-story building in a suburb.

39
00:03:35,500 --> 00:03:39,400
MIA: But it would greatly improve how you feel if you live in an urban high-rise.

40
00:03:39,900 --> 00:03:41,600
LEO: Especially if you don't have a balcony.

41
00:03:42,200 --> 00:03:42,500
MIA: Yes.

42
00:03:43,400 --> 00:03:47,900
MIA: I think homes of the future will all need access to a shared working space.

43
00:03:48,500 --> 00:03:56,100
MIA: Somewhere in the same building or a group of houses where people can go and work instead of just having a laptop on the kitchen table.

44
00:03:56,700 --> 00:04:01,500
LEO: Yes, so they aren't having to travel to an office but can still interact with others.

45
00:04:01,900 --> 00:04:02,100
MIA: Hmm.

46
00:04:02,500 --> 00:04:07,100
LEO: That's often how new ideas get generated by chatting to someone from a different profession.

47
00:04:07,700 --> 00:04:08,000
MIA: Yeah.

48
00:04:08,800 --> 00:04:17,900
MIA: I read about a type of design where the internal walls of an apartment are movable, so the space can be adapted over time as people's needs change.

49
00:04:18,500 --> 00:04:24,200
LEO: Like when children leave school and start working but still continue to live with their parents for many years.

50
00:04:24,600 --> 00:04:27,100
LEO: Or when an elderly relative moves in with the family.

51
00:04:27,700 --> 00:04:32,200
LEO: It would mean they could still have their own space, specially designed for their needs.

52
00:04:32,700 --> 00:04:33,000
MIA: Yes.

53
00:04:33,800 --> 00:04:38,400
MIA: Have you heard about those smart bathroom mirrors which can monitor people's health?

54
00:04:38,900 --> 00:04:42,900
MIA: They recognize signs of illness and contact a doctor automatically.

55
00:04:43,500 --> 00:04:43,800
LEO: Hmm.

56
00:04:44,400 --> 00:04:46,100
LEO: Not so sure they're a good idea.

57
00:04:46,700 --> 00:04:47,200
MIA: Nor am I.

58
00:04:47,900 --> 00:04:50,900
MIA: People might worry about conditions which aren't serious at all.

59
00:04:51,400 --> 00:04:52,300
LEO: What about transport?

60
00:04:53,500 --> 00:05:02,900
LEO: Wouldn't it be good if there were bike sheds with charging points so people could store their electric bikes securely and charge them up at the same time?

61
00:05:03,300 --> 00:05:03,600
MIA: Yes.

62
00:05:04,300 --> 00:05:07,800
MIA: That would encourage more people to cycle instead of using their car.

63
00:05:08,500 --> 00:05:09,900
MIA: Much better for the planet.

64
00:05:10,300 --> 00:05:10,600
LEO: Hmm.

65
00:05:10,900 --> 00:05:18,600
LEO: I read about one housing development where cars had to be left just outside it, so the center was all a pedestrianized area.

66
00:05:18,900 --> 00:05:20,500
LEO: Great for families with children.

67
00:05:21,000 --> 00:05:21,400
MIA: Maybe.

68
00:05:22,100 --> 00:05:25,100
MIA: But what if you're disabled or elderly and can't walk far?

69
00:05:25,700 --> 00:05:27,700
MIA: It wouldn't be so good for people like that.

70
00:05:28,100 --> 00:05:28,400
LEO: No.

71
00:05:29,300 --> 00:05:34,700
MIA: I saw a scheme for communal vegetable plots where neighbors could decide what to grow together.

72
00:05:35,400 --> 00:05:41,400
MIA: That would be a great way for older people to get to know one another, especially if they're no longer going out to work.

73
00:05:41,900 --> 00:05:45,800
LEO: Yes, doing something together is always more enjoyable, isn't it?

74
00:05:46,300 --> 00:05:47,900
LEO: Do you think we might be able to look into that?

75
00:05:52,200 --> 00:05:53,600
ANNOUNCER: That is the end of part three.

76
00:05:55,400 --> 00:05:59,700
ANNOUNCER: You now have 30 seconds to check your answers to part three.
$srt_2026_3_copy$::text), false
        ),
        '{2,transcript_highlights}', $highlights$[{"question_number":21,"phrase":"We've got to support our points by referring to specific cases."},{"question_number":22,"phrase":"How about housing for different generations living together?"},{"question_number":22,"phrase":"Let's go with that."},{"question_number":23,"phrase":"But I think the solution is to design multi-story apartment blocks."},{"question_number":23,"phrase":"Building up rather than out, yes."},{"question_number":24,"phrase":"Okay, how about increased use of roof space on high-rise buildings for gardens?"},{"question_number":24,"phrase":"But it would greatly improve how you feel if you live in an urban high-rise."},{"question_number":25,"phrase":"I think homes of the future will all need access to a shared working space.","show_badge":false},{"question_number":25,"phrase":"Somewhere in the same building or a group of houses where people can go and work instead of just having a laptop on the kitchen table."},{"question_number":25,"phrase":"That's often how new ideas get generated by chatting to someone from a different profession."},{"question_number":26,"phrase":"I read about a type of design where the internal walls of an apartment are movable."},{"question_number":26,"phrase":"Or when an elderly relative moves in with the family.","show_badge":false},{"question_number":26,"phrase":"It would mean they could still have their own space, specially designed for their needs."},{"question_number":27,"phrase":"Have you heard about those smart bathroom mirrors which can monitor people's health?"},{"question_number":27,"phrase":"People might worry about conditions which aren't serious at all."},{"question_number":28,"phrase":"Wouldn't it be good if there were bike sheds with charging points so people could store their electric bikes securely and charge them up at the same time?"},{"question_number":28,"phrase":"Much better for the planet."},{"question_number":29,"phrase":"I read about one housing development where cars had to be left just outside it, so the center was all a pedestrianized area."},{"question_number":29,"phrase":"It wouldn't be so good for people like that."},{"question_number":30,"phrase":"I saw a scheme for communal vegetable plots where neighbors could decide what to grow together."},{"question_number":30,"phrase":"That would be a great way for older people to get to know one another, especially if they're no longer going out to work."}]$highlights$::jsonb, true
      )::text,
      updated_at = now()
  WHERE id = '323f05a4-f218-4177-80af-1eb85e98365b'::uuid
    AND test_type = 'listening'
    AND cambridge_year = 2026
    AND cambridge_test_number = 4
    AND jsonb_typeof(content::jsonb) = 'array'
    AND jsonb_array_length(content::jsonb) = 4;

  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  IF affected_rows <> 1 THEN
    RAISE EXCEPTION 'Expected one Cambridge 21 Test 4 Listening passage, updated %', affected_rows;
  END IF;
END
$migration$;

DO $part_2_highlights$
DECLARE
  affected_rows integer;
BEGIN
  UPDATE public.passages
  SET content = jsonb_set(
        content::jsonb,
        '{1,transcript_highlights}',
        $highlights$[
          {"question_number":11,"phrase":"We also used the breakout area where people could sit down and relax and try out our products."},
          {"question_number":11,"phrase":"And due to popular request, we used that again last year."},
          {"question_number":12,"phrase":"Last year, we also sponsored the innovative business connection zone, where people could leave their contact details on a board to contact other companies."},
          {"question_number":13,"phrase":"The scheme is available to every member of your organization."},
          {"question_number":14,"phrase":"Businesses who exhibit with us can claim discounts on a number of popular brands, including major high street fashion and jewelry outlets."},
          {"question_number":14,"phrase":"as well as grocery chains","show_badge":false},
          {"question_number":14,"phrase":"Discounts available range from 3.5% up to an amazing 15%."},
          {"question_number":15,"phrase":"Rather to his surprise, this became a bit of a sensation, and in a remarkably short time, he had opened an amazing 76 restaurants worldwide."},
          {"question_number":16,"phrase":"He also makes regular donations to organizations"},
          {"question_number":16,"phrase":"helping those in need, both in the UK and elsewhere in the world."},
          {"question_number":17,"phrase":"He'll be telling you about what he discovered during his travels around the world, about business practices in different cultures."},
          {"question_number":18,"phrase":"Her main business interest is in technology.","show_badge":false},
          {"question_number":18,"phrase":"But she's also passionate about helping people gain employment and organizes an annual jobs fair"},
          {"question_number":18,"phrase":"so she'll be concentrating on this in her talk."},
          {"question_number":19,"phrase":"He'll be talking about the need for flexibility to cope with new directions in today's business world."},
          {"question_number":20,"phrase":"Her session will offer an interactive look at different obstacles in people's own lives, not just in business."},
          {"question_number":20,"phrase":"She also looks at how you can overcome them."}
        ]$highlights$::jsonb,
        true
      )::text,
      updated_at = now()
  WHERE id = '323f05a4-f218-4177-80af-1eb85e98365b'::uuid
    AND test_type = 'listening'
    AND cambridge_year = 2026
    AND cambridge_test_number = 4
    AND jsonb_typeof(content::jsonb) = 'array'
    AND jsonb_array_length(content::jsonb) = 4;

  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  IF affected_rows <> 1 THEN
    RAISE EXCEPTION 'Expected one Cambridge 21 Test 4 Listening passage for Part 2 highlights, updated %',
      affected_rows;
  END IF;
END
$part_2_highlights$;

DO $remaining_highlights$
DECLARE
  affected_rows integer;
BEGIN
  UPDATE public.passages
  SET content = jsonb_set(
        jsonb_set(
          content::jsonb,
          '{0,transcript_highlights}',
          $part_1$[
            {"question_number":1,"phrase":"It's L E I G H."},
            {"question_number":2,"phrase":"Well, normally I catch the bus, but I'm on my motorbike today because I'm going to work later."},
            {"question_number":3,"phrase":"Well, I've just been to the hairdresser."},
            {"question_number":4,"phrase":"Thanks a lot.","show_badge":false},
            {"question_number":4,"phrase":"And now I'm on my way to buy a suit that I can wear to the interview."},
            {"question_number":5,"phrase":"Yeah.","show_badge":false},
            {"question_number":5,"phrase":"Well, I've got to go and pick up my laptop."},
            {"question_number":6,"phrase":"If I'm free on a Monday, that's when I choose to come into town."},
            {"question_number":7,"phrase":"For example, there are a lot of new coffee shops now."},
            {"question_number":7,"phrase":"No.","show_badge":false},
            {"question_number":7,"phrase":"There are too many of them."},
            {"question_number":8,"phrase":"Well,","show_badge":false},
            {"question_number":8,"phrase":"I think we have enough clothing shops, but there's only one place that sells books at the moment."},
            {"question_number":8,"phrase":"It'd be nice to have a choice, you know."},
            {"question_number":9,"phrase":"The glass roof is certainly impressive, but my favorite thing is the plants they've put around the building."},
            {"question_number":10,"phrase":"I can't see any advantage in having it there because the one in town is actually bigger."}
          ]$part_1$::jsonb,
          true
        ),
        '{3,transcript_highlights}',
        $part_4$[
          {"question_number":31,"phrase":"They may also be negatively affected by having their routine disturbed."},
          {"question_number":32,"phrase":"They identified nearly 100 trials involving a total of 7,000 patients.","show_badge":false},
          {"question_number":32,"phrase":"who were played recorded music as part of their post-operative care."},
          {"question_number":33,"phrase":"However, a common factor was that the chosen music had a calming quality."},
          {"question_number":34,"phrase":"More often though, the mode of delivery was by what are known as music pillows."},
          {"question_number":35,"phrase":"When asked to report their experience of listening to music, surgical patients said that either they had no feelings of anxiety at any point.","show_badge":false},
          {"question_number":35,"phrase":"Or those feelings were only slight."},
          {"question_number":36,"phrase":"And in every case, those who were given music to listen to didn't need as much medication to ease their pain as those patients who weren't played music."},
          {"question_number":37,"phrase":"didn't make much difference","show_badge":false},
          {"question_number":37,"phrase":"And it even worked when patients were played music under general anesthetic, although the positive effects were greater when patients were awake."},
          {"question_number":38,"phrase":"But the researchers came to the conclusion that it worked on patients by distraction."},
          {"question_number":39,"phrase":"And if they prefer, recordings taken from nature can be just as good as music."},
          {"question_number":40,"phrase":"Clearly, there's more to learn about this area.","show_badge":false},
          {"question_number":40,"phrase":"And the team now plan to focus their next research on the most appropriate volume to play the music at."}
        ]$part_4$::jsonb,
        true
      )::text,
      updated_at = now()
  WHERE id = '323f05a4-f218-4177-80af-1eb85e98365b'::uuid
    AND test_type = 'listening'
    AND cambridge_year = 2026
    AND cambridge_test_number = 4
    AND jsonb_typeof(content::jsonb) = 'array'
    AND jsonb_array_length(content::jsonb) = 4;

  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  IF affected_rows <> 1 THEN
    RAISE EXCEPTION 'Expected one Cambridge 21 Test 4 Listening passage for remaining highlights, updated %',
      affected_rows;
  END IF;
END
$remaining_highlights$;
