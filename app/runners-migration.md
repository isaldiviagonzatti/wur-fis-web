# GitLab Migration Preparation - Step-by-Step Guide for Project Owners

## Migration Overview

In the new GitLab instance, we're transitioning from 500 group or project-specific runners to a limited number of instance-level runners (shared runners). These runners have specific tags to indicate their type and all include the `instance` tag to mark them as instance runners.

## Available runner types in the new environment

The new instance will have the following runner types:

- **Kubernetes runners**: Tags `k8s`, `instance`

## Step-by-step preparation guide

### Step 1: Inventory your current runners

*Step 1 needs to be accomplished, before the production migration date!*

1. Go to your project/group in GitLab
2. Navigate to **Settings** → **CI/CD** → **Runners**
3. Review which runners are currently being used by your project. If the runners are connected to a group above your project which you can't access, please contact someone who can.
4. Note the tags of these runners
5. Check your `.gitlab-ci.yml` files to see which tags your CI/CD jobs use

### Step 2: Determine which runner types you need

Analyze your CI/CD pipelines and determine if you can make use of the Shared runner or need a specific one:

Some examples what you can do with the WUR Shared Kubernetes runner:
- Build container images (with Kaniko) and push them to registries
- Pipeline checks, linting, security scanning
- Kubernetes/helm deployments (Kubernetes authentication required, see instructions below)
- ... and a lot more!

What you currently <strong>can't</strong> do with the WUR Shared Kubernetes Runners:
- Specific task that need communication with WUR Managed Servers (Infrastructure as Code)
- Other tasks that need specific networking whitelisting

If you need your own runner or another type of runner you can put it in the request in step 5


### Step 3: Check your .gitlab-ci.yml configuration

If your jobs can run with one of the tags please update them by using the tags as explained below.

1. Open your `.gitlab-ci.yml` files
2. Look for `tags:` sections in your jobs, or add if not configured yet.
3. Replace current tags with the appropriate new tags:
   ```yaml
   # Example for Kubernetes jobs
   deploy:
     tags:
       - k8s
       - instance
   ```

### Step 4: Identify projects which use private registries

If your project uses private registries, please note down their name so runners with a specific service account can be created.

### Step 5: Submit requests to the service desk

**If you have special requirements:**

1. Go to the Avisi service desk
2. Submit a request with the title: "GitLab Migration - Custom Runner Requirements"
3. Include in your request:
   - Project name and URL
   - Why the standard runners (k8s, docker, shell) are insufficient
   - Technical details about the required configuration
   - If your project needs a serviceaccount for private registry access please also include:
     - Container registry details


## Kubernetes Authentication

By default, the WUR Gitlab shared runners do not have access to Kubernetes resources on the Kubernetes platform. If you would like to manage Kubernetes objects in namespaces you own, the runner needs a service account with privileges on those specific namespaces. To accomplish this, there are two solutions:

1. Use the Shared Runner and supply the bearer token of the service account to the runner through the `.gitlab-ci.yml` [Gitlab docs](https://docs.gitlab.com/runner/executors/kubernetes/#set-the-bearer-token-for-kubernetes-api-calls)
2. Deploy a Personal group or project runner and define the service account in the `config.toml`: [Gitlab docs](https://docs.gitlab.com/runner/executors/kubernetes/#other-configtoml-settings)

In both cases, there is a service account needed.
More information on Kubernetes Service accounts can be found in de [Kubernetes documentation]()

### Creating service account
The service account can be created with the following steps:

1. Create a manifest for the service account
```bash
kubectl create serviceaccount glr-serviceaccount -n my-application-namespace -o yaml --dry-run=client > glr-serviceaccount.yaml
```
2. Create a secret which holds the token for the service account
```bash
cat <<EOF > glr-serviceaccount-token.yaml
apiVersion: v1
kind: Secret
metadata:
  name: glr-serviceaccount-token
  annotations:
    kubernetes.io/service-account.name: glr-serviceaccount
type: kubernetes.io/service-account-token
EOF
```
3. Create a new file called `glr-rbac.yaml` and add the needed rights for the service account
```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: gitlab-runner
rules:
- apiGroups: [""]
  resources: ["events"]
  verbs: ["list","watch"]
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["create","delete","get","list","watch"]
- apiGroups: [""]
  resources: ["pods/attach"]
  verbs: ["create","delete","get","patch"]
- apiGroups: [""]
  resources: ["pods/exec"]
  verbs: ["create","delete","get","patch"]
- apiGroups: [""]
  resources: ["pods/log"]
  verbs: ["get","list"]
- apiGroups: [""]
  resources: ["secrets"]
  verbs: ["create","delete","get","update"]
- apiGroups: [""]
  resources: ["serviceaccounts"]
  verbs: ["get"]
- apiGroups: [""]
  resources: ["services"]
  verbs: ["create","get"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: gitlab-runner
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: gitlab-runner
subjects:
- kind: ServiceAccount
  name: glr-service-account
  namespace: my-application-namespace # The namespace where the Service account was deployed
```

4. Add these files to the cluster through ArgoCD or apply manually:
```bash
# Manually add the files to the cluster (Not adviced, Use ArgoCD instead!)
kubectl apply -f glr-serviceaccount.yaml -n my-application-namespace
kubectl apply -f glr-serviceaccount-token.yaml -n my-application-namespace
kubectl apply -f glr-rbac.yaml -n my-application-namespace
```

5. Request token of service account
```bash
kubectl get secrets glr-serviceaccount-token -o jsonpath='{.data.token}' | base64 -d
```

Supply this token to your Gitlab-runner `config.toml` or as a variable to the Shared runners.

More information can be found here:
https://docs.gitlab.com/runner/executors/kubernetes/#set-the-bearer-token-for-kubernetes-api-calls