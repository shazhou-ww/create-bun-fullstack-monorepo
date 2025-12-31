import { describe, it, expect } from 'vitest';
import { handler } from './index';
import type { APIGatewayProxyEvent, Context } from 'aws-lambda';

describe('handler', () => {
  it('should return 200 with message', async () => {
    const event = {} as APIGatewayProxyEvent;
    const context = {
      callbackWaitsForEmptyEventLoop: true,
      functionName: 'test-function',
      functionVersion: '1',
      invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:test',
      memoryLimitInMB: '128',
      awsRequestId: 'test-request-id',
      logGroupName: '/aws/lambda/test',
      logStreamName: '2024/01/01/[$LATEST]test',
      getRemainingTimeInMillis: () => 30000,
      done: () => {},
      fail: () => {},
      succeed: () => {}
    } as Context;

    const result = await handler(event, context);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.message).toContain('{{name}}');
  });
});

