import { NextResponse } from 'next/server';
import clientPromise, { DB_NAME } from '@/lib/mongodb';
import { WithId, Document } from 'mongodb';

export async function GET(request: Request) {
	try {
		const cookieHeader = request.headers.get('cookie') || '';
		if (!cookieHeader.includes('session_user=')) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const client = await clientPromise;
		const db = client.db(DB_NAME);
		const requests = await db.collection('requests').find({}).toArray();

		const statusCounts: Record<string, number> = {
			'Accepted': 0,
			'Pending': 0,
			'Approved': 0,
			'Completed': 0,
			'In Work': 0,
			'Closed': 0,
			'Rejected': 0,
			'Overdue': 0,
		};

		requests.forEach((r: WithId<Document>) => {
			const s = ((r.status as string) || 'Pending');
			if (statusCounts[s] === undefined) {
				statusCounts['Pending'] += 1; // fallback bucket
			} else {
				statusCounts[s] += 1;
			}
		});

		const chartData = [
			{ name: 'Accepted',  value: statusCounts['Accepted'],  color: '#f97316' }, // orange
			{ name: 'Pending',   value: statusCounts['Pending'],   color: '#22c55e' }, // green
			{ name: 'Approved',  value: statusCounts['Approved'],  color: '#ef4444' }, // red
			{ name: 'Completed', value: statusCounts['Completed'], color: '#8b5cf6' }, // purple
			{ name: 'In Work',   value: statusCounts['In Work'],   color: '#3b82f6' }, // blue
			{ name: 'Closed',    value: statusCounts['Closed'],    color: '#ea580c' }, // dark orange
		];

		return NextResponse.json({
			total: requests.length,
			statusCounts,
			chartData,
		});
	} catch (e) {
		console.error('GET /api/requests/kpis error', e);
		return NextResponse.json({ error: 'Failed to build KPI data' }, { status: 500 });
	}
}

