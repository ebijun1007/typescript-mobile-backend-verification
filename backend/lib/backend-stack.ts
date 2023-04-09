import * as cdk from '@aws-cdk/core';
import * as lambda from "@aws-cdk/aws-lambda";
import * as apigw from "@aws-cdk/aws-apigateway";
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class BackendStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    // Lambda layer
    const lambdaLayer = new lambda.LayerVersion(this, `NestApplambdaLayer`, {
      code: lambda.Code.fromAsset("app/node_modules"),
      compatibleRuntimes: [
        lambda.Runtime.NODEJS_16_X,
      ],
    });

    // Lambda
    const appLambda = new lambda.Function(this, `NestApplambda`, {
      runtime: lambda.Runtime.NODEJS_16_X,
      code: lambda.Code.fromAsset("app/dist"),
      handler: "main.handler",
      layers: [lambdaLayer],
      environment: {
        NODE_PATH: "$NODE_PATH:/opt",
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1",
      },
      timeout: cdk.Duration.seconds(30),
    });
    // API Gateway
    const restApi = new apigw.RestApi(this, `NestAppApiGateway`, {
      restApiName: `NestAppApiGw`,
      deployOptions: {
        stageName: "v1",
      },
      // CORS設定
      defaultCorsPreflightOptions: {
        // warn: 要件に合わせ適切なパラメータに絞る
        allowOrigins: apigw.Cors.ALL_ORIGINS,
        allowMethods: apigw.Cors.ALL_METHODS,
        allowHeaders: apigw.Cors.DEFAULT_HEADERS,
        statusCode: 200,
      },
    });

    restApi.root.addProxy({
      defaultIntegration: new apigw.LambdaIntegration(appLambda),
      anyMethod: true
    });
  }
}
