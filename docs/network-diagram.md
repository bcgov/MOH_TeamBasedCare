# Network Diagram

The deployed AWS resources use `ca-central-1` by default. The CloudFront
distribution is global; its ACM certificate is managed in `us-east-1`.

```mermaid
flowchart TB
    User[Users and browsers]
    Keycloak[Keycloak / BC Government Common Logon<br/>External identity service]
    GitHub[GitHub Actions<br/>External deployment service]

    subgraph Global[AWS global services]
        CloudFront[CloudFront distribution<br/>HTTPS, routing, security headers]
        ACM[ACM certificate<br/>us-east-1]
        CFF[CloudFront Functions<br/>viewer request and response]
    end

    subgraph Region[AWS ca-central-1]
        S3[S3 app bucket<br/>Next.js static assets]
        APIGW[API Gateway HTTP API<br/>Regional endpoint]

        subgraph VPC[Existing application VPC]
            subgraph AZA[Availability Zone ca-central-1a]
                AppA[App subnet<br/>Lambda network interface]
                DataA[Data subnet]
            end

            subgraph AZB[Availability Zone ca-central-1b]
                AppB[App subnet<br/>Lambda network interface]
                DataB[Data subnet]
            end

            Lambda[Lambda<br/>NestJS API]
            Aurora[(Aurora PostgreSQL 15)]
            AppSG[App security group]
            DataSG[Database security group]
        end
    end

    User -->|HTTPS :443| CloudFront
    CloudFront -->|Static assets| S3
    CloudFront -->|/api/* over HTTPS, uncached| APIGW
    CloudFront -.->|Uses| ACM
    CloudFront -.->|Executes| CFF
    APIGW -->|AWS_PROXY| Lambda

    Lambda --- AppA
    Lambda --- AppB
    Aurora --- DataA
    Aurora --- DataB
    Lambda -->|TCP :5432| Aurora
    AppSG -.->|Attached to Lambda| Lambda
    DataSG -.->|Attached to Aurora| Aurora
    AppSG -.->|Ingress allowed on TCP :5432| DataSG

    Lambda -->|OAuth2/OIDC over HTTPS| Keycloak
    GitHub -->|Terraform and deployment via IAM/OIDC| S3
    GitHub -->|Deploys| Lambda
    GitHub -->|Invalidates| CloudFront
```

CloudFront serves the S3-hosted web application and forwards `/api/*`
requests to the regional API Gateway endpoint. The Lambda function is attached
to the existing app subnets in the VPC and accesses Aurora in the data
subnets. The database security group permits PostgreSQL traffic from the app
security group.

The Terraform configuration does not define the VPC, route tables, NAT
gateways, or subnet resources. Those resources are discovered by name, so
this diagram does not infer routes or internet egress paths that are not
present in the repository.
