import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Edit,
  Trash2,
  ArrowUp,
  FileQuestion,
  FileText,
  Upload,
  Table as TableIcon,
} from 'lucide-react';
import { Question } from '@/entities';
import { uploadFile } from '@/lib/supabase';
import TableBuilder from './TableBuilder';

const PassageQuestionManager = ({
  selectedContent,
  questions,
  loadAllData,
  showToast,
  setEditingQuestion,
  editingQuestion,
  setActiveTab,
  setSelectedContent,
}) => {
  const [formData, setFormData] = useState({
    question_text: '',
    correct_answer: '',
    question_type: '',
    section: '',
    question_number: '',
    options: [],
    explanation: '',
    tags: '',
    group_instructions: '',
    instruction_image_url: '',
    model_answer: '',
    cue_card_bullets: [],
    matching_data: { headings: [], paragraphs: [] },
    table_data: { table_structure: '', blank_positions: [] },
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [localQuestions, setLocalQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  // Fallback loader if parent does not provide questions/loadAllData
  const localLoadAllData = async () => {
    if (!selectedContent?.id) return;
    try {
      setLoadingQuestions(true);
      const all = await Question.list();
      setLocalQuestions(all.filter((q) => q.passage_id === selectedContent.id));
    } catch (err) {
      console.error('Failed to load questions:', err);
      showToast && showToast('Error', 'Failed to load questions', 'destructive');
    } finally {
      setLoadingQuestions(false);
    }
  };

  useEffect(() => {
    if (!questions) {
      localLoadAllData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedContent?.id]);

  useEffect(() => {
    if (editingQuestion) {
      setFormData({
        question_text: editingQuestion.question_text || '',
        correct_answer: editingQuestion.correct_answer || '',
        question_type: editingQuestion.question_type || '',
        section: editingQuestion.section || '',
        question_number: editingQuestion.question_number || '',
        options: editingQuestion.options || [],
        explanation: editingQuestion.explanation || '',
        tags: editingQuestion.tags || '',
        group_instructions: editingQuestion.group_instructions || '',
        instruction_image_url: editingQuestion.instruction_image_url || '',
        model_answer: editingQuestion.model_answer || '',
        cue_card_bullets: editingQuestion.cue_card_bullets || [],
        matching_data: editingQuestion.matching_data || {
          headings: [],
          paragraphs: [],
          content_items: [],
          questions: [],
          numbering_type: 'alphabetical',
          total_items: 6,
          number_of_questions: 4,
        },
        table_data: editingQuestion.table_data || { table_structure: '', blank_positions: [] },
      });
    } else {
      setFormData({
        question_text: '',
        correct_answer: '',
        question_type: '',
        section: '',
        question_number: '',
        options: [],
        explanation: '',
        tags: '',
        group_instructions: '',
        instruction_image_url: '',
        model_answer: '',
        cue_card_bullets: [],
        matching_data: {
          headings: [],
          paragraphs: [],
          content_items: [],
          questions: [],
          numbering_type: 'alphabetical',
          total_items: 6,
          number_of_questions: 4,
        },
        table_data: { table_structure: '', blank_positions: [] },
      });
    }
  }, [editingQuestion]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleInstructionImageUpload = async (file) => {
    if (!file) return;
    setUploadingImage(true);
    try {
      const { file_url } = await uploadFile(file);
      setFormData((prev) => ({ ...prev, instruction_image_url: file_url }));
      showToast?.('Success', 'Image uploaded successfully!');
    } catch (error) {
      console.error('Failed to upload image:', error);
      showToast?.('Error', 'Failed to upload image.', 'destructive');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const questionData = {
        ...formData,
        passage_id: selectedContent.id,
        options: formData.options.length > 0 ? formData.options : null,
        cue_card_bullets: formData.cue_card_bullets.length > 0 ? formData.cue_card_bullets : null,
        matching_data: null,
        table_data: formData.question_type === 'table_completion' ? formData.table_data : null,
      };

      if (editingQuestion) {
        await Question.update(editingQuestion.id, questionData);
        showToast('Success', 'Question updated successfully!');
      } else {
        await Question.create(questionData);
        showToast('Success', 'Question added successfully!');
      }

      setEditingQuestion(null);
      if (loadAllData) {
        await loadAllData();
      } else {
        await localLoadAllData();
      }
    } catch (error) {
      console.error('Error saving question:', error);
      showToast('Error', 'Failed to save question.', 'destructive');
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (confirm('Are you sure you want to delete this question?')) {
      try {
        await Question.delete(questionId);
        if (loadAllData) {
          await loadAllData();
        } else {
          await localLoadAllData();
        }
        showToast('Success', 'Question deleted successfully!');
      } catch (error) {
        console.error('Error deleting question:', error);
        showToast('Error', 'Failed to delete question.', 'destructive');
      }
    }
  };

  const sourceQuestions = questions || localQuestions;
  const questionsForSelectedPassage = sourceQuestions.filter(
    (q) => q.passage_id === selectedContent.id
  );

  const renderQuestionForm = () => {
    return (
      <Card className="bg-card border-border" data-oid=":mb32i1">
        <CardHeader data-oid="y7df6fl">
          <CardTitle data-oid="e73_qzk">
            {editingQuestion ? 'Edit Question' : 'Add New Question'}
          </CardTitle>
        </CardHeader>
        <CardContent data-oid="kkagxpj">
          <form onSubmit={handleSubmit} className="space-y-6" data-oid="fqvu8.6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6" data-oid="zkn8zjw">
              <div className="space-y-4" data-oid="htksel7">
                <div data-oid="7fgth1h">
                  <Label htmlFor="question_type" data-oid="p_viefa">
                    Question Type
                  </Label>
                  <Select
                    value={formData.question_type}
                    onValueChange={(value) => handleSelectChange('question_type', value)}
                    data-oid="hi6t:5u"
                  >
                    <SelectTrigger data-oid="3ke7_75">
                      <SelectValue placeholder="Select question type" data-oid="k7qesqy" />
                    </SelectTrigger>
                    <SelectContent data-oid="2m.u.9m">
                      <SelectItem value="multiple_choice" data-oid="2i97_8p">
                        Multiple Choice
                      </SelectItem>
                      <SelectItem value="true_false_not_given" data-oid="-q5fo66">
                        True/False/Not Given
                      </SelectItem>
                      <SelectItem value="yes_no_not_given" data-oid="g:sb.8n">
                        Yes/No/Not Given
                      </SelectItem>

                      <SelectItem value="matching_features" data-oid="wuov9dk">
                        Matching Features
                      </SelectItem>
                      <SelectItem value="matching_sentence_endings" data-oid="kk6fbg8">
                        Matching Sentence Endings
                      </SelectItem>
                      <SelectItem value="summary_completion" data-oid="v07:obp">
                        Summary Completion
                      </SelectItem>
                      <SelectItem value="note_completion" data-oid="uka-96l">
                        Note Completion
                      </SelectItem>
                      <SelectItem value="table_completion" data-oid="8q:h8v_">
                        Table Completion
                      </SelectItem>
                      <SelectItem value="flow_chart_completion" data-oid="-avy8kb">
                        Flow-chart Completion
                      </SelectItem>
                      <SelectItem value="diagram_label_completion" data-oid="-a0-iq0">
                        Diagram Label Completion
                      </SelectItem>
                      <SelectItem value="short_answer" data-oid="y7ywfxd">
                        Short Answer
                      </SelectItem>
                      <SelectItem value="sentence_completion" data-oid="oo3._:z">
                        Sentence Completion
                      </SelectItem>
                      <SelectItem value="descriptive_writing" data-oid="qxnqx:j">
                        Descriptive Writing (Task 1)
                      </SelectItem>
                      <SelectItem value="essay" data-oid="_kpaa9d">
                        Essay (Task 2)
                      </SelectItem>
                      <SelectItem value="discussion_question" data-oid="wkhzauf">
                        Discussion Question
                      </SelectItem>
                      <SelectItem value="topic_talk" data-oid="e-cg3-q">
                        Topic Talk (Part 1)
                      </SelectItem>
                      <SelectItem value="cue_card" data-oid="b2x1ume">
                        Cue Card (Part 2)
                      </SelectItem>
                      <SelectItem value="follow_up_questions" data-oid="ilc4z73">
                        Follow-up Questions (Part 3)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div data-oid="e0.xe8q">
                  <Label htmlFor="section" data-oid="qv:1h1:">
                    Section/Passage
                  </Label>
                  <Input
                    id="section"
                    name="section"
                    value={formData.section}
                    onChange={handleInputChange}
                    placeholder="e.g., Section 1 or Passage 2"
                    data-oid="-:k7go:"
                  />
                </div>

                <div data-oid="w-uy1:x">
                  <Label htmlFor="question_number" data-oid="4h1s10y">
                    Question Number
                  </Label>
                  <Input
                    id="question_number"
                    name="question_number"
                    type="number"
                    value={formData.question_number}
                    onChange={handleInputChange}
                    data-oid="6fa1k2x"
                  />
                </div>

                <div data-oid="x7jdlx9">
                  <Label htmlFor="question_text" data-oid="p3io__.">
                    Question Text
                  </Label>
                  <Textarea
                    id="question_text"
                    name="question_text"
                    value={formData.question_text}
                    onChange={handleInputChange}
                    rows={4}
                    data-oid="8o8079r"
                  />
                </div>

                <div data-oid="zorljq9">
                  <Label htmlFor="correct_answer" data-oid="5y69l1i">
                    Correct Answer
                  </Label>
                  <Input
                    id="correct_answer"
                    name="correct_answer"
                    value={formData.correct_answer}
                    onChange={handleInputChange}
                    placeholder="For multiple answers, separate with commas"
                    data-oid="grhyq5e"
                  />
                </div>

                {formData.question_type === 'multiple_choice' && (
                  <div data-oid="tssxfl0">
                    <Label htmlFor="options" data-oid="tv2-2p.">
                      Options (one per line)
                    </Label>
                    <Textarea
                      id="options"
                      value={formData.options.join('\n')}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          options: e.target.value.split('\n').filter((o) => o.trim()),
                        }))
                      }
                      rows={4}
                      data-oid="it7a-7k"
                    />
                  </div>
                )}

                {formData.question_type === 'table_completion' && (
                  <div className="space-y-4" data-oid="sk1zsl2">
                    <div className="flex items-center gap-2 mb-4" data-oid="i0fs:go">
                      <TableIcon className="w-5 h-5 text-blue-600" data-oid="d90q5_n" />
                      <Label className="text-lg font-medium" data-oid="6g.2ba2">
                        Table Completion Builder
                      </Label>
                    </div>
                    <TableBuilder
                      initialData={
                        formData.table_data.headers
                          ? formData.table_data
                          : {
                              headers: formData.table_data.table_headers || [
                                'Category',
                                'Information',
                              ],

                              rows: formData.table_data.table_rows || [
                                ['', ''],
                                ['', ''],
                              ],

                              blanks: formData.table_data.blank_positions || [],
                              instructions:
                                formData.table_data.table_structure ||
                                'Complete the table below. Choose NO MORE THAN THREE WORDS from the passage for each answer.',
                              wordLimit: formData.table_data.word_limit || 3,
                            }
                      }
                      onChange={(tableData) => {
                        setFormData((prev) => ({
                          ...prev,
                          table_data: {
                            table_structure: tableData.instructions,
                            table_headers: tableData.headers,
                            table_rows: tableData.rows,
                            blank_positions: tableData.blanks,
                            word_limit: tableData.wordLimit,
                            blanks_count: tableData.blanks.length,
                          },
                        }));
                      }}
                      className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900"
                      data-oid="6_pzi_d"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-4" data-oid="zi:u4bn">
                <div data-oid="mb5a6b1">
                  <Label htmlFor="explanation" data-oid="bvexkcq">
                    Explanation
                  </Label>
                  <Textarea
                    id="explanation"
                    name="explanation"
                    value={formData.explanation}
                    onChange={handleInputChange}
                    rows={3}
                    data-oid="f9jij44"
                  />
                </div>

                <div data-oid="tj:uej2">
                  <Label htmlFor="tags" data-oid="qz3c-dv">
                    Tags (comma-separated)
                  </Label>
                  <Input
                    id="tags"
                    name="tags"
                    value={formData.tags}
                    onChange={handleInputChange}
                    data-oid="trpt3b3"
                  />
                </div>

                <div data-oid=":8lzqdu">
                  <Label htmlFor="group_instructions" data-oid=".w3vxel">
                    Group Instructions
                  </Label>
                  <Textarea
                    id="group_instructions"
                    name="group_instructions"
                    value={formData.group_instructions}
                    onChange={handleInputChange}
                    rows={3}
                    data-oid="4xb6229"
                  />
                </div>

                <div data-oid="_cs:-_t">
                  <Label htmlFor="instruction_image_url" data-oid="lnj4utd">
                    Instruction Image
                  </Label>
                  <div className="flex items-center gap-3 mb-2" data-oid="gopkj-q">
                    <input
                      id="instruction-image-input"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleInstructionImageUpload(e.target.files?.[0])}
                      data-oid="iqe_:6f"
                    />

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('instruction-image-input')?.click()}
                      disabled={uploadingImage}
                      data-oid="du8az4i"
                    >
                      <Upload className="w-4 h-4 mr-2" data-oid="z0ygloh" />{' '}
                      {uploadingImage ? 'Uploading...' : 'Upload Image'}
                    </Button>
                    {formData.instruction_image_url && (
                      <a
                        href={formData.instruction_image_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary underline truncate max-w-xs"
                        data-oid="l7rh_n2"
                      >
                        {formData.instruction_image_url}
                      </a>
                    )}
                  </div>
                  <Input
                    id="instruction_image_url"
                    name="instruction_image_url"
                    value={formData.instruction_image_url}
                    onChange={handleInputChange}
                    placeholder="Or paste an image URL here"
                    data-oid="2fgi-39"
                  />
                </div>

                <div data-oid="_02imer">
                  <Label htmlFor="model_answer" data-oid="zkrn8zl">
                    Model Answer
                  </Label>
                  <Textarea
                    id="model_answer"
                    name="model_answer"
                    value={formData.model_answer}
                    onChange={handleInputChange}
                    rows={4}
                    data-oid="13:x5rm"
                  />
                </div>

                <div data-oid="-.lomxh">
                  <Label data-oid="kt07snv">Cue Card Bullets (one per line)</Label>
                  <Textarea
                    value={formData.cue_card_bullets.join('\n')}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        cue_card_bullets: e.target.value.split('\n').filter((b) => b.trim()),
                      }))
                    }
                    rows={4}
                    data-oid="6h1u.12"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4" data-oid="mmpa71q">
              {editingQuestion && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingQuestion(null)}
                  data-oid="xqbq_3e"
                >
                  Cancel Edit
                </Button>
              )}
              <Button type="submit" data-oid=".34twcx">
                {editingQuestion ? 'Update Question' : 'Add Question'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  };

  const renderQuestionsList = () => {
    return (
      <Card className="bg-card border-border mt-6" data-oid="_i:5s41">
        <CardHeader data-oid="36fsip9">
          <CardTitle data-oid="f94huqf">Existing Questions</CardTitle>
        </CardHeader>
        <CardContent data-oid="giijj2_">
          <div className="space-y-4" data-oid="qf2_rb1">
            {questionsForSelectedPassage.map((question, index) => (
              <div
                key={question.id}
                className="border border-border rounded-lg p-4 bg-muted/30"
                data-oid="s7-s665"
              >
                <div className="flex items-start justify-between" data-oid="d.yc4_o">
                  <div className="flex-1" data-oid="0d133uu">
                    <div className="flex items-center gap-2 mb-2" data-oid="y5oi7nx">
                      <Badge variant="outline" className="text-xs" data-oid="mgll8rf">
                        Q{question.question_number}
                      </Badge>
                      <Badge variant="secondary" className="text-xs" data-oid="j04f_ww">
                        {question.question_type}
                      </Badge>
                      <Badge variant="outline" className="text-xs" data-oid="i9qv1_y">
                        {question.section}
                      </Badge>
                    </div>
                    <h4 className="font-medium text-foreground mb-2" data-oid="qsnyeuv">
                      {question.question_text}
                    </h4>

                    {question.correct_answer && (
                      <div className="text-sm text-muted-foreground mb-2" data-oid="kx3mi1a">
                        <strong data-oid="z1t3fsd">Correct Answer(s):</strong>
                        <span
                          className="ml-2 font-mono bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded text-xs"
                          data-oid="l9fgk.k"
                        >
                          {question.correct_answer}
                        </span>
                        {question.correct_answer?.includes(',') && (
                          <span
                            className="ml-2 text-xs text-green-600 dark:text-green-400"
                            data-oid="hbhgn6t"
                          >
                            (Multiple answers accepted)
                          </span>
                        )}
                      </div>
                    )}

                    {question.options &&
                      question.options.length > 0 &&
                      question.question_type === 'multiple_choice' && (
                        <div className="text-sm text-muted-foreground mb-2" data-oid="x_dqlds">
                          <strong data-oid="1mn07n3">Options:</strong>
                          <ul className="mt-1 ml-4 list-disc" data-oid="31n325n">
                            {question.options.map((option, idx) => (
                              <li key={idx} data-oid="az:382m">
                                {option}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                    {question.question_type === 'table_completion' && question.table_data && (
                      <div
                        className="text-sm text-muted-foreground mb-2 space-y-2"
                        data-oid="b-l5v0-"
                      >
                        <div data-oid="jv1kd:b">
                          <strong data-oid="odsu5da">Table Structure (HTML):</strong>
                          <pre
                            className="mt-1 ml-4 p-2 bg-muted rounded text-xs overflow-auto max-h-40"
                            data-oid="df4hxfx"
                          >
                            {question.table_data.table_structure}
                          </pre>
                        </div>
                        <div data-oid="u6c2b7-">
                          <strong data-oid="qst7dja">Blank Positions & Answers:</strong>
                          <ul className="mt-1 ml-4 list-disc" data-oid="kwfsm_.">
                            {question.table_data.blank_positions?.map((b, idx) => (
                              <li key={idx} data-oid="q-e_by8">
                                Blank {b.blank_number}: {b.answer}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    {question.explanation && (
                      <div className="text-sm text-muted-foreground" data-oid="1u9va7.">
                        <strong data-oid="kvue9x2">Explanation:</strong> {question.explanation}
                      </div>
                    )}
                    {question.group_instructions && (
                      <div className="text-sm text-muted-foreground" data-oid="bvm6h04">
                        <strong data-oid="y6n.53:">Group Instructions:</strong>{' '}
                        {question.group_instructions}
                      </div>
                    )}
                    {question.instruction_image_url && (
                      <div className="text-sm text-muted-foreground" data-oid="b8v:.ly">
                        <strong data-oid="e-9c3wi">Instruction Image:</strong>{' '}
                        <a
                          href={question.instruction_image_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                          data-oid="6.-e6fo"
                        >
                          View
                        </a>
                      </div>
                    )}
                    {question.model_answer && (
                      <div className="text-sm text-muted-foreground" data-oid="gu.7gnx">
                        <strong data-oid="e:qs:pe">Model Answer:</strong> {question.model_answer}
                      </div>
                    )}
                    {question.cue_card_bullets && question.cue_card_bullets.length > 0 && (
                      <div className="text-sm text-muted-foreground" data-oid="8w_l7oy">
                        <strong data-oid="agm83ub">Cue Card Bullets:</strong>
                        <ul className="mt-1 ml-4 list-disc" data-oid="nl4bvdc">
                          {question.cue_card_bullets.map((bullet, idx) => (
                            <li key={idx} data-oid="7ow68fa">
                              {bullet}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4" data-oid="bjpe457">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingQuestion(question)}
                      data-oid="jmgomz9"
                    >
                      <Edit className="w-4 h-4" data-oid="du22br:" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteQuestion(question.id)}
                      data-oid="_.5cx6f"
                    >
                      <Trash2 className="w-4 h-4" data-oid="lri5vs3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {questionsForSelectedPassage.length === 0 && (
              <div className="text-center py-8 text-muted-foreground" data-oid="gu:bgmp">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" data-oid="1sk-9pb" />
                <p data-oid="hc4vrez">No questions added yet. Create your first question above.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6" data-oid="eav8cxr">
      <div className="flex items-center justify-between mb-4" data-oid="cai4w4c">
        <div data-oid="p_dqi:8">
          <h3
            className="text-3xl font-bold text-foreground flex items-center gap-3 mb-2"
            data-oid="9c_jmvl"
          >
            <FileQuestion className="w-8 h-8 text-primary" data-oid="0i6lh9q" />
            Questions for: {selectedContent.title}
          </h3>
          <p className="text-muted-foreground text-lg" data-oid="-ruc5ec">
            Manage questions for this test passage
          </p>
        </div>
        <Button
          onClick={() => {
            setActiveTab('tests');
            setEditingQuestion(null);
            setSelectedContent && setSelectedContent(null);
          }}
          className="bg-secondary hover:bg-secondary/90 text-secondary-foreground"
          data-oid="88:ptfo"
        >
          <ArrowUp className="w-4 h-4 mr-2" data-oid="fh:-ju6" /> Back to Test Management
        </Button>
      </div>

      {renderQuestionForm()}
      {loadingQuestions ? (
        <Card className="bg-card border-border mt-6" data-oid="e2bssgt">
          <CardContent data-oid=":q-qwq0">
            <div className="py-10 text-center text-muted-foreground" data-oid="bzrpuxr">
              Loading questions...
            </div>
          </CardContent>
        </Card>
      ) : (
        renderQuestionsList()
      )}
    </div>
  );
};

export default PassageQuestionManager;
