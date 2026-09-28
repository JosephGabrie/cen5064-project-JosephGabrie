'use client';

import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const questionSchema = z.object({
  question: z.string().min(1, 'Question text is required'),
  answer: z.string().min(1, 'Answer is required'),
  points: z.number().min(1, 'Points must be at least 1'),
  type: z.enum(['multiple_choice', 'free_form', 'fill_in_the_blank', 'true_false']),
});

const formSchema = z.object({
  classId: z.string().min(1, 'Class ID is required'),
  dueDate: z.string().min(1, 'Due Date is required'),
  assignmentType: z.enum(['question', 'file']),
  fileUrl: z.string().optional(),
  questions: z.array(questionSchema).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function CreateAssignmentForm() {
  const [assignmentType, setAssignmentType] = useState<'question' | 'file'>('question');

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      assignmentType: 'question',
      questions: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    name: 'questions',
    control,
  });

  const watchAssignmentType = watch('assignmentType');

  // Sync state for easy conditional rendering if needed, though we can use watch
  React.useEffect(() => {
    setAssignmentType(watchAssignmentType);
  }, [watchAssignmentType]);

  const onSubmit = async (data: FormValues) => {
    // To be implemented: API call to backend
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 p-6 max-w-2xl mx-auto border rounded-lg shadow-sm bg-card">
      <div>
        <h2 className="text-2xl font-bold mb-4">Create Assignment</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="classId" className="block text-sm font-medium mb-1">Class ID</label>
          <Input id="classId" {...register('classId')} />
          {errors.classId && <p className="text-red-500 text-sm">{errors.classId.message}</p>}
        </div>

        <div>
          <label htmlFor="dueDate" className="block text-sm font-medium mb-1">Due Date</label>
          <Input id="dueDate" type="datetime-local" {...register('dueDate')} />
          {errors.dueDate && <p className="text-red-500 text-sm">{errors.dueDate.message}</p>}
        </div>

        <fieldset>
          <legend className="text-sm font-medium mb-2">Assignment Type</legend>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="question"
                {...register('assignmentType')}
                aria-label="Question"
              />
              Question
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="file"
                {...register('assignmentType')}
                aria-label="File"
              />
              File
            </label>
          </div>
        </fieldset>

        {assignmentType === 'file' && (
          <div>
            <label htmlFor="fileUrl" className="block text-sm font-medium mb-1">File URL</label>
            <Input id="fileUrl" {...register('fileUrl')} placeholder="https://..." />
            {errors.fileUrl && <p className="text-red-500 text-sm">{errors.fileUrl.message}</p>}
          </div>
        )}

        {assignmentType === 'question' && (
          <div className="space-y-4 border p-4 rounded-md mt-4">
            <h3 className="font-semibold">Questions</h3>
            {fields.map((field, index) => (
              <div key={field.id} className="flex flex-col gap-2 p-4 border rounded relative">
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                >
                  X
                </button>
                <div>
                  <label className="text-xs font-semibold">Type</label>
                  <select {...register(`questions.${index}.type` as const)} className="block w-full p-2 border rounded">
                    <option value="multiple_choice">Multiple Choice</option>
                    <option value="free_form">Free Form</option>
                    <option value="fill_in_the_blank">Fill in the Blank</option>
                    <option value="true_false">True / False</option>
                  </select>
                </div>
                <div>
                  <Input placeholder="Enter question text" {...register(`questions.${index}.question` as const)} />
                  {errors.questions?.[index]?.question && <p className="text-red-500 text-xs">{errors.questions[index].question.message}</p>}
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input placeholder="Answer" {...register(`questions.${index}.answer` as const)} />
                    {errors.questions?.[index]?.answer && <p className="text-red-500 text-xs">{errors.questions[index].answer.message}</p>}
                  </div>
                  <div className="w-24">
                    <Input type="number" placeholder="Points" {...register(`questions.${index}.points` as const, { valueAsNumber: true })} />
                    {errors.questions?.[index]?.points && <p className="text-red-500 text-xs">{errors.questions[index].points.message}</p>}
                  </div>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={() => append({ question: '', answer: '', points: 1, type: 'multiple_choice' })}>
              Add Question
            </Button>
          </div>
        )}
      </div>

      <Button type="submit" className="w-full">Create Assignment</Button>
    </form>
  );
}
