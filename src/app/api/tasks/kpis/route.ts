import { NextResponse } from "next/server";
import clientPromise, { DB_NAME } from "@/lib/mongodb";
import { WithId, Document } from "mongodb";

export async function GET(request: Request) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    if (!cookieHeader.includes('session_user=')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const tasks = await db.collection('tasks').find({}).toArray();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    
    let onTime = 0;
    let overdue = 0;
    let completed = 0;
    let inProgress = 0;
    
    tasks.forEach((task: WithId<Document>) => {
      const status = (task.status as string) || '';
      const dueDateStr = (task.dueDate as string) || '';
      
      if (status.toLowerCase() === 'done') {
        completed++;
        // Completed tasks are considered on-time
        onTime++;
      } else if (dueDateStr) {
        // Parse due date
        const dueDate = new Date(dueDateStr);
        dueDate.setHours(23, 59, 59, 999); // End of due date
        
        if (dueDate < today) {
          // Past due and not completed
          overdue++;
        } else {
          // Still within deadline (in progress but on-time)
          inProgress++;
          onTime++;
        }
      } else {
        // No due date specified, consider in progress and on-time
        inProgress++;
        onTime++;
      }
    });
    
    const total = tasks.length;
    
    const kpis = {
      total,
      completed,
      inProgress,
      onTime,
      overdue,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      overdueRate: total > 0 ? Math.round((overdue / total) * 100) : 0,
      chartData: [
        {
          name: 'On Time',
          value: onTime,
          color: '#22c55e' // green
        },
        {
          name: 'Overdue',
          value: overdue,
          color: '#ef4444' // red
        }
      ].filter(item => item.value > 0) // Only include categories with data
    };
    
    return NextResponse.json(kpis);
  } catch (error) {
    console.error('Error fetching task KPIs:', error);
    return NextResponse.json({ error: 'Failed to fetch task KPIs' }, { status: 500 });
  }
}