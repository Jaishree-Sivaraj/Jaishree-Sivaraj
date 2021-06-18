# esgapi v0.0.0



- [Auth](#auth)
	- [Authenticate](#authenticate)
	- [AuthenticateOTP](#authenticateotp)
	
- [AverageSd](#averagesd)
	- [Create average sd](#create-average-sd)
	- [Delete average sd](#delete-average-sd)
	- [Retrieve average sd](#retrieve-average-sd)
	- [Retrieve average sds](#retrieve-average-sds)
	- [Update average sd](#update-average-sd)
	
- [Batches](#batches)
	- [Create batches](#create-batches)
	- [Delete batches](#delete-batches)
	- [Retrieve batches](#retrieve-batches)
	- [Update batches](#update-batches)
	
- [BoardMembers](#boardmembers)
	- [Create board members](#create-board-members)
	- [Delete board members](#delete-board-members)
	- [Retrieve board members](#retrieve-board-members)
	- [Update board members](#update-board-members)
	
- [BoardMembersMatrixDataPoints](#boardmembersmatrixdatapoints)
	- [Create board members matrix data points](#create-board-members-matrix-data-points)
	- [Delete board members matrix data points](#delete-board-members-matrix-data-points)
	- [Retrieve board members matrix data points](#retrieve-board-members-matrix-data-points)
	- [Update board members matrix data points](#update-board-members-matrix-data-points)
	
- [Categories](#categories)
	- [Create categories](#create-categories)
	- [Delete categories](#delete-categories)
	- [Retrieve categories](#retrieve-categories)
	- [Update categories](#update-categories)
	
- [ClientRepresentatives](#clientrepresentatives)
	- [Create client representatives](#create-client-representatives)
	- [Delete client representatives](#delete-client-representatives)
	- [Retrieve client representatives](#retrieve-client-representatives)
	- [Update client representatives](#update-client-representatives)
	
- [ClientTaxonomy](#clienttaxonomy)
	- [Create client taxonomy](#create-client-taxonomy)
	- [Delete client taxonomy](#delete-client-taxonomy)
	- [Retrieve client taxonomies](#retrieve-client-taxonomies)
	- [Retrieve client taxonomy](#retrieve-client-taxonomy)
	- [Update client taxonomy](#update-client-taxonomy)
	
- [Companies](#companies)
	- [Create companies](#create-companies)
	- [Delete companies](#delete-companies)
	- [Retrieve companies](#retrieve-companies)
	- [Retrieve NIC](#retrieve-nic)
	- [Update companies](#update-companies)
	
- [CompanyRepAssignment](#companyrepassignment)
	- [Create company rep assignment](#create-company-rep-assignment)
	- [Delete company rep assignment](#delete-company-rep-assignment)
	- [Retrieve company rep assignment](#retrieve-company-rep-assignment)
	- [Retrieve company rep assignments](#retrieve-company-rep-assignments)
	- [Update company rep assignment](#update-company-rep-assignment)
	
- [CompanyRepresentatives](#companyrepresentatives)
	- [Create company representatives](#create-company-representatives)
	- [Delete company representatives](#delete-company-representatives)
	- [Retrieve company representatives](#retrieve-company-representatives)
	- [Update company representatives](#update-company-representatives)
	
- [CompanyTaxonomies](#companytaxonomies)
	- [Create company taxonomies](#create-company-taxonomies)
	- [Delete company taxonomies](#delete-company-taxonomies)
	- [Retrieve company taxonomies](#retrieve-company-taxonomies)
	- [Update company taxonomies](#update-company-taxonomies)
	
- [Controversy](#controversy)
	- [Create controversy](#create-controversy)
	- [Delete controversy](#delete-controversy)
	- [Generate controversy JSON](#generate-controversy-json)
	- [Retrieve controversies](#retrieve-controversies)
	- [Retrieve controversy](#retrieve-controversy)
	- [Update controversy](#update-controversy)
	- [Upload controversy](#upload-controversy)
	
- [Datapoints](#datapoints)
	- [Add categoryId for datapoints](#add-categoryid-for-datapoints)
	- [Add polarity for datapoints](#add-polarity-for-datapoints)
	- [Create datapoints](#create-datapoints)
	- [Delete datapoints](#delete-datapoints)
	- [Retrieve datapoints](#retrieve-datapoints)
	- [Update datapoints](#update-datapoints)
	
- [DerivedDatapoints](#deriveddatapoints)
	- [Calculate derived datapoints for a company](#calculate-derived-datapoints-for-a-company)
	- [Create derived datapoints](#create-derived-datapoints)
	- [Delete derived datapoints](#delete-derived-datapoints)
	- [Generate JSON](#generate-json)
	- [Retrieve derived datapoints](#retrieve-derived-datapoints)
	- [Update derived datapoints](#update-derived-datapoints)
	
- [Employees](#employees)
	- [Create employees](#create-employees)
	- [Delete employees](#delete-employees)
	- [Retrieve employees](#retrieve-employees)
	- [Update employees](#update-employees)
	
- [Error](#error)
	- [Create error](#create-error)
	- [Delete error](#delete-error)
	- [Retrieve error](#retrieve-error)
	- [Retrieve errors](#retrieve-errors)
	- [Update error](#update-error)
	
- [ErrorDetails](#errordetails)
	- [Create error details](#create-error-details)
	- [Delete error details](#delete-error-details)
	- [Retrieve error details](#retrieve-error-details)
	- [Update error details](#update-error-details)
	
- [Functions](#functions)
	- [Create functions](#create-functions)
	- [Delete functions](#delete-functions)
	- [Retrieve functions](#retrieve-functions)
	- [Update functions](#update-functions)
	
- [GroupAnalyst](#groupanalyst)
	- [Create group analyst](#create-group-analyst)
	- [Delete group analyst](#delete-group-analyst)
	- [Retrieve group analyst](#retrieve-group-analyst)
	- [Retrieve group analysts](#retrieve-group-analysts)
	- [Update group analyst](#update-group-analyst)
	
- [Group](#group)
	- [Create group](#create-group)
	- [Delete group](#delete-group)
	- [Retrieve group](#retrieve-group)
	- [Retrieve groups](#retrieve-groups)
	- [Update group](#update-group)
	
- [GroupQa](#groupqa)
	- [Create group qa](#create-group-qa)
	- [Delete group qa](#delete-group-qa)
	- [Retrieve group qa](#retrieve-group-qa)
	- [Retrieve group qas](#retrieve-group-qas)
	- [Update group qa](#update-group-qa)
	
- [KeyIssues](#keyissues)
	- [Create key issues](#create-key-issues)
	- [Delete key issues](#delete-key-issues)
	- [Retrieve key issues](#retrieve-key-issues)
	- [Update key issues](#update-key-issues)
	
- [Kmp](#kmp)
	- [Create kmp](#create-kmp)
	- [Delete kmp](#delete-kmp)
	- [Retrieve kmp](#retrieve-kmp)
	- [Retrieve kmps](#retrieve-kmps)
	- [Update kmp](#update-kmp)
	
- [KmpMatrixDataPoints](#kmpmatrixdatapoints)
	- [Create kmp matrix data points](#create-kmp-matrix-data-points)
	- [Delete kmp matrix data points](#delete-kmp-matrix-data-points)
	- [Retrieve kmp matrix data points](#retrieve-kmp-matrix-data-points)
	- [Update kmp matrix data points](#update-kmp-matrix-data-points)
	
- [MasterTaxonomy](#mastertaxonomy)
	- [Create master taxonomy](#create-master-taxonomy)
	- [Delete master taxonomy](#delete-master-taxonomy)
	- [Retrieve master taxonomies](#retrieve-master-taxonomies)
	- [Retrieve master taxonomy](#retrieve-master-taxonomy)
	- [Update master taxonomy](#update-master-taxonomy)
	
- [PasswordReset](#passwordreset)
	- [Send email](#send-email)
	- [Submit password](#submit-password)
	- [Verify token](#verify-token)
	
- [PolarityRules](#polarityrules)
	- [Create polarity rules](#create-polarity-rules)
	- [Delete polarity rules](#delete-polarity-rules)
	- [Retrieve percentile calculation](#retrieve-percentile-calculation)
	- [Retrieve polarity rules](#retrieve-polarity-rules)
	- [Update polarity rules](#update-polarity-rules)
	
- [Reference](#reference)
	- [Create reference](#create-reference)
	- [Delete reference](#delete-reference)
	- [Retrieve reference](#retrieve-reference)
	- [Retrieve references](#retrieve-references)
	- [Update reference](#update-reference)
	
- [Role](#role)
	- [Create role](#create-role)
	- [Delete role](#delete-role)
	- [Retrieve role](#retrieve-role)
	- [Retrieve roles](#retrieve-roles)
	- [Update role](#update-role)
	
- [Rules](#rules)
	- [Create rules](#create-rules)
	- [Delete rules](#delete-rules)
	- [Retrieve rules](#retrieve-rules)
	- [Update rules](#update-rules)
	
- [StandaloneDatapoints](#standalonedatapoints)
	- [Create standalone datapoints](#create-standalone-datapoints)
	- [Delete standalone datapoints](#delete-standalone-datapoints)
	- [Retrieve standalone datapoints](#retrieve-standalone-datapoints)
	- [Update standalone datapoints](#update-standalone-datapoints)
	- [Upload Company ESG files](#upload-company-esg-files)
	
- [TaskAssignment](#taskassignment)
	- [Create task assignment](#create-task-assignment)
	- [Delete task assignment](#delete-task-assignment)
	- [Retrieve task assignment](#retrieve-task-assignment)
	- [Retrieve task assignments](#retrieve-task-assignments)
	- [Update task assignment](#update-task-assignment)
	
- [TaskSlaLog](#taskslalog)
	- [Create task sla log](#create-task-sla-log)
	- [Delete task sla log](#delete-task-sla-log)
	- [Retrieve task sla log](#retrieve-task-sla-log)
	- [Retrieve task sla logs](#retrieve-task-sla-logs)
	- [Update task sla log](#update-task-sla-log)
	
- [Taxonomies](#taxonomies)
	- [Create taxonomies](#create-taxonomies)
	- [Delete taxonomies](#delete-taxonomies)
	- [Retrieve taxonomies](#retrieve-taxonomies)
	- [Update taxonomies](#update-taxonomies)
	
- [Themes](#themes)
	- [Create themes](#create-themes)
	- [Delete themes](#delete-themes)
	- [Retrieve themes](#retrieve-themes)
	- [Update themes](#update-themes)
	
- [User](#user)
	- [Create user](#create-user)
	- [Delete user](#delete-user)
	- [Onboard new user](#onboard-new-user)
	- [Retrieve current user](#retrieve-current-user)
	- [Retrieve user](#retrieve-user)
	- [Retrieve users](#retrieve-users)
	- [Retrieve users approvals](#retrieve-users-approvals)
	- [Retrieve users by role](#retrieve-users-by-role)
	- [Update password](#update-password)
	- [Update user](#update-user)
	- [Update user status](#update-user-status)
	
- [ValidationRules](#validationrules)
	- [Create validation rules](#create-validation-rules)
	- [Delete validation rules](#delete-validation-rules)
	- [Retrieve validation rules](#retrieve-validation-rules)
	- [Update validation rules](#update-validation-rules)
	
- [Validations](#validations)
	- [Create validations](#create-validations)
	- [Delete validations](#delete-validations)
	- [Retrieve validations](#retrieve-validations)
	- [Update validations](#update-validations)
	
- [Ztables](#ztables)
	- [Create ztables](#create-ztables)
	- [Delete ztables](#delete-ztables)
	- [Retrieve ztables](#retrieve-ztables)
	- [Update ztables](#update-ztables)
	


# Auth

## Authenticate



	POST /auth

### Headers

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| Authorization			| String			|  <p>Basic authorization with email and password.</p>							|

### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>Master access_token.</p>							|

## AuthenticateOTP



	POST /auth/auth-otp


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>Master access_token.</p>							|
| email			| String			|  <p>User's email.</p>							|
| otp			| String			|  <p>User's otp.</p>							|

# AverageSd

## Create average sd



	POST /average_sd


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| companyId			| 			|  <p>Average sd's companyId.</p>							|
| year			| 			|  <p>Average sd's year.</p>							|
| stdDeviation			| 			|  <p>Average sd's stdDeviation.</p>							|
| status			| 			|  <p>Average sd's status.</p>							|

## Delete average sd



	DELETE /average_sd/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|

## Retrieve average sd



	GET /average_sd/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|

## Retrieve average sds



	GET /average_sd


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| q			| String			| **optional** <p>Query to search.</p>							|
| page			| Number			| **optional** <p>Page number.</p>							|
| limit			| Number			| **optional** <p>Amount of returned items.</p>							|
| sort			| String[]			| **optional** <p>Order of returned items.</p>							|
| fields			| String[]			| **optional** <p>Fields to be returned.</p>							|

## Update average sd



	PUT /average_sd/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| companyId			| 			|  <p>Average sd's companyId.</p>							|
| year			| 			|  <p>Average sd's year.</p>							|
| stdDeviation			| 			|  <p>Average sd's stdDeviation.</p>							|
| status			| 			|  <p>Average sd's status.</p>							|

# Batches

## Create batches



	POST /batches


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| batchName			| 			|  <p>Batches's batchName.</p>							|
| batchSLA			| 			|  <p>Batches's batchSLA.</p>							|

## Delete batches



	DELETE /batches/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|

## Retrieve batches



	GET /batches


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| q			| String			| **optional** <p>Query to search.</p>							|
| page			| Number			| **optional** <p>Page number.</p>							|
| limit			| Number			| **optional** <p>Amount of returned items.</p>							|
| sort			| String[]			| **optional** <p>Order of returned items.</p>							|
| fields			| String[]			| **optional** <p>Fields to be returned.</p>							|

## Update batches



	PUT /batches/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| batchName			| 			|  <p>Batches's batchName.</p>							|
| batchSLA			| 			|  <p>Batches's batchSLA.</p>							|
| status			| 			|  <p>Batches's status.</p>							|

# BoardMembers

## Create board members



	POST /boardMembers


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| companyId			| 			|  <p>Board members's companyId.</p>							|
| boardMemberName			| 			|  <p>Board members's boardMemberName.</p>							|
| year			| 			|  <p>Board members's year.</p>							|
| memberStatus			| 			|  <p>Board members's memberStatus.</p>							|

## Delete board members



	DELETE /boardMembers/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|

## Retrieve board members



	GET /boardMembers


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| q			| String			| **optional** <p>Query to search.</p>							|
| page			| Number			| **optional** <p>Page number.</p>							|
| limit			| Number			| **optional** <p>Amount of returned items.</p>							|
| sort			| String[]			| **optional** <p>Order of returned items.</p>							|
| fields			| String[]			| **optional** <p>Fields to be returned.</p>							|

## Update board members



	PUT /boardMembers/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| companyId			| 			|  <p>Board members's companyId.</p>							|
| boardMemberName			| 			|  <p>Board members's boardMemberName.</p>							|
| year			| 			|  <p>Board members's year.</p>							|
| memberStatus			| 			|  <p>Board members's memberStatus.</p>							|
| status			| 			|  <p>Board members's status.</p>							|

# BoardMembersMatrixDataPoints

## Create board members matrix data points



	POST /boardMembersMatrixDataPoints


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| datapointId			| 			|  <p>Board members matrix data points's datapointId.</p>							|
| companyId			| 			|  <p>Board members matrix data points's companyId.</p>							|
| memberName			| 			|  <p>Board members matrix data points's memberName.</p>							|
| year			| 			|  <p>Board members matrix data points's year.</p>							|
| response			| 			|  <p>Board members matrix data points's response.</p>							|
| fiscalYearEndDate			| 			|  <p>Board members matrix data points's fiscalYearEndDate.</p>							|
| memberStatus			| 			|  <p>Board members matrix data points's memberStatus.</p>							|

## Delete board members matrix data points



	DELETE /boardMembersMatrixDataPoints/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|

## Retrieve board members matrix data points



	GET /boardMembersMatrixDataPoints


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| q			| String			| **optional** <p>Query to search.</p>							|
| page			| Number			| **optional** <p>Page number.</p>							|
| limit			| Number			| **optional** <p>Amount of returned items.</p>							|
| sort			| String[]			| **optional** <p>Order of returned items.</p>							|
| fields			| String[]			| **optional** <p>Fields to be returned.</p>							|

## Update board members matrix data points



	PUT /boardMembersMatrixDataPoints/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| datapointId			| 			|  <p>Board members matrix data points's datapointId.</p>							|
| companyId			| 			|  <p>Board members matrix data points's companyId.</p>							|
| memberName			| 			|  <p>Board members matrix data points's memberName.</p>							|
| year			| 			|  <p>Board members matrix data points's year.</p>							|
| response			| 			|  <p>Board members matrix data points's response.</p>							|
| fiscalYearEndDate			| 			|  <p>Board members matrix data points's fiscalYearEndDate.</p>							|
| memberStatus			| 			|  <p>Board members matrix data points's memberStatus.</p>							|
| status			| 			|  <p>Board members matrix data points's status.</p>							|

# Categories

## Create categories



	POST /categories


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>admin access token.</p>							|
| categoryName			| 			|  <p>Categories's categoryName.</p>							|
| categoryCode			| 			|  <p>Categories's categoryCode.</p>							|
| categoryDescription			| 			|  <p>Categories's categoryDescription.</p>							|

## Delete categories



	DELETE /categories/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>admin access token.</p>							|

## Retrieve categories



	GET /categories


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| q			| String			| **optional** <p>Query to search.</p>							|
| page			| Number			| **optional** <p>Page number.</p>							|
| limit			| Number			| **optional** <p>Amount of returned items.</p>							|
| sort			| String[]			| **optional** <p>Order of returned items.</p>							|
| fields			| String[]			| **optional** <p>Fields to be returned.</p>							|

## Update categories



	PUT /categories/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>admin access token.</p>							|
| categoryName			| 			|  <p>Categories's categoryName.</p>							|
| categoryCode			| 			|  <p>Categories's categoryCode.</p>							|
| categoryDescription			| 			|  <p>Categories's categoryDescription.</p>							|
| status			| 			|  <p>Categories's status.</p>							|

# ClientRepresentatives

## Create client representatives



	POST /client-representatives


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| userId			| 			|  <p>Client representatives's userId.</p>							|
| name			| 			|  <p>Client representatives's name.</p>							|
| companyId			| 			|  <p>Client representatives's companyId.</p>							|
| authenticationLetterForClientUrl			| 			|  <p>Client representatives's authenticationLetterForClientUrl.</p>							|
| companyIdForClient			| 			|  <p>Client representatives's companyIdForClient.</p>							|
| status			| 			|  <p>Client representatives's status.</p>							|

## Delete client representatives



	DELETE /client-representatives/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|

## Retrieve client representatives



	GET /client-representatives


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| q			| String			| **optional** <p>Query to search.</p>							|
| page			| Number			| **optional** <p>Page number.</p>							|
| limit			| Number			| **optional** <p>Amount of returned items.</p>							|
| sort			| String[]			| **optional** <p>Order of returned items.</p>							|
| fields			| String[]			| **optional** <p>Fields to be returned.</p>							|

## Update client representatives



	PUT /client-representatives/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| userId			| 			|  <p>Client representatives's userId.</p>							|
| name			| 			|  <p>Client representatives's name.</p>							|
| companyId			| 			|  <p>Client representatives's companyId.</p>							|
| authenticationLetterForClientUrl			| 			|  <p>Client representatives's authenticationLetterForClientUrl.</p>							|
| companyIdForClient			| 			|  <p>Client representatives's companyIdForClient.</p>							|
| status			| 			|  <p>Client representatives's status.</p>							|

# ClientTaxonomy

## Create client taxonomy



	POST /clientTaxonomies


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| taxonomyName			| 			|  <p>Client taxonomy's taxonomyName.</p>							|
| fields			| 			|  <p>Client taxonomy's fields.</p>							|

## Delete client taxonomy



	DELETE /clientTaxonomies/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|

## Retrieve client taxonomies



	GET /clientTaxonomies


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| q			| String			| **optional** <p>Query to search.</p>							|
| page			| Number			| **optional** <p>Page number.</p>							|
| limit			| Number			| **optional** <p>Amount of returned items.</p>							|
| sort			| String[]			| **optional** <p>Order of returned items.</p>							|
| fields			| String[]			| **optional** <p>Fields to be returned.</p>							|

## Retrieve client taxonomy



	GET /clientTaxonomies/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|

## Update client taxonomy



	PUT /clientTaxonomies/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| taxonomyName			| 			|  <p>Client taxonomy's taxonomyName.</p>							|
| fields			| 			|  <p>Client taxonomy's fields.</p>							|

# Companies

## Create companies



	POST /companies


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| companyName			| 			|  <p>Companies's companyName.</p>							|
| cin			| 			|  <p>Companies's cin.</p>							|
| nicCode			| 			|  <p>Companies's nicCode.</p>							|
| nic			| 			|  <p>Companies's nic.</p>							|
| nicIndustry			| 			|  <p>Companies's nicIndustry.</p>							|
| isinCode			| 			|  <p>Companies's isinCode.</p>							|
| cmieProwessCode			| 			|  <p>Companies's cmieProwessCode.</p>							|
| socialAnalystName			| 			|  <p>Companies's socialAnalystName.</p>							|
| socialQAName			| 			|  <p>Companies's socialQAName.</p>							|

## Delete companies



	DELETE /companies/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|

## Retrieve companies



	GET /companies


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| q			| String			| **optional** <p>Query to search.</p>							|
| page			| Number			| **optional** <p>Page number.</p>							|
| limit			| Number			| **optional** <p>Amount of returned items.</p>							|
| sort			| String[]			| **optional** <p>Order of returned items.</p>							|
| fields			| String[]			| **optional** <p>Fields to be returned.</p>							|

## Retrieve NIC



	GET /companies/all_nic


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| q			| String			| **optional** <p>Query to search.</p>							|
| page			| Number			| **optional** <p>Page number.</p>							|
| limit			| Number			| **optional** <p>Amount of returned items.</p>							|
| sort			| String[]			| **optional** <p>Order of returned items.</p>							|
| fields			| String[]			| **optional** <p>Fields to be returned.</p>							|

## Update companies



	PUT /companies/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| companyName			| 			|  <p>Companies's companyName.</p>							|
| cin			| 			|  <p>Companies's cin.</p>							|
| nicCode			| 			|  <p>Companies's nicCode.</p>							|
| nic			| 			|  <p>Companies's nic.</p>							|
| nicIndustry			| 			|  <p>Companies's nicIndustry.</p>							|
| isinCode			| 			|  <p>Companies's isinCode.</p>							|
| cmieProwessCode			| 			|  <p>Companies's cmieProwessCode.</p>							|
| socialAnalystName			| 			|  <p>Companies's socialAnalystName.</p>							|
| socialQAName			| 			|  <p>Companies's socialQAName.</p>							|
| status			| 			|  <p>Companies's status.</p>							|

# CompanyRepAssignment

## Create company rep assignment



	POST /companyRepAssignment


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>master access token.</p>							|
| userId			| 			|  <p>Company rep assignment's userId.</p>							|
| assignedId			| 			|  <p>Company rep assignment's assignedId.</p>							|
| assignedDate			| 			|  <p>Company rep assignment's assignedDate.</p>							|
| status			| 			|  <p>Company rep assignment's status.</p>							|
| createdAt			| 			|  <p>Company rep assignment's createdAt.</p>							|
| updatedAt			| 			|  <p>Company rep assignment's updatedAt.</p>							|

## Delete company rep assignment



	DELETE /companyRepAssignment/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>master access token.</p>							|

## Retrieve company rep assignment



	GET /companyRepAssignment/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>master access token.</p>							|

## Retrieve company rep assignments



	GET /companyRepAssignment


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>master access token.</p>							|
| q			| String			| **optional** <p>Query to search.</p>							|
| page			| Number			| **optional** <p>Page number.</p>							|
| limit			| Number			| **optional** <p>Amount of returned items.</p>							|
| sort			| String[]			| **optional** <p>Order of returned items.</p>							|
| fields			| String[]			| **optional** <p>Fields to be returned.</p>							|

## Update company rep assignment



	PUT /companyRepAssignment/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>master access token.</p>							|
| userId			| 			|  <p>Company rep assignment's userId.</p>							|
| assignedId			| 			|  <p>Company rep assignment's assignedId.</p>							|
| assignedDate			| 			|  <p>Company rep assignment's assignedDate.</p>							|
| status			| 			|  <p>Company rep assignment's status.</p>							|
| createdAt			| 			|  <p>Company rep assignment's createdAt.</p>							|
| updatedAt			| 			|  <p>Company rep assignment's updatedAt.</p>							|

# CompanyRepresentatives

## Create company representatives



	POST /company-representatives


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| userId			| 			|  <p>Company representatives's userId.</p>							|
| name			| 			|  <p>Company representatives's name.</p>							|
| companiesList			| 			|  <p>Company representatives's companiesList.</p>							|
| authenticationLetterForCompanyUrl			| 			|  <p>Company representatives's authenticationLetterForCompanyUrl.</p>							|
| companyIdForCompany			| 			|  <p>Company representatives's companyIdForCompany.</p>							|
| status			| 			|  <p>Company representatives's status.</p>							|

## Delete company representatives



	DELETE /company-representatives/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|

## Retrieve company representatives



	GET /company-representatives


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| q			| String			| **optional** <p>Query to search.</p>							|
| page			| Number			| **optional** <p>Page number.</p>							|
| limit			| Number			| **optional** <p>Amount of returned items.</p>							|
| sort			| String[]			| **optional** <p>Order of returned items.</p>							|
| fields			| String[]			| **optional** <p>Fields to be returned.</p>							|

## Update company representatives



	PUT /company-representatives/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| userId			| 			|  <p>Company representatives's userId.</p>							|
| name			| 			|  <p>Company representatives's name.</p>							|
| companiesList			| 			|  <p>Company representatives's companiesList.</p>							|
| authenticationLetterForCompanyUrl			| 			|  <p>Company representatives's authenticationLetterForCompanyUrl.</p>							|
| companyIdForCompany			| 			|  <p>Company representatives's companyIdForCompany.</p>							|
| status			| 			|  <p>Company representatives's status.</p>							|

# CompanyTaxonomies

## Create company taxonomies



	POST /company_taxonomies


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| companyId			| 			|  <p>Company taxonomies's companyId.</p>							|
| taxonomies			| 			|  <p>Company taxonomies's taxonomies.</p>							|

## Delete company taxonomies



	DELETE /company_taxonomies/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|

## Retrieve company taxonomies



	GET /company_taxonomies


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| q			| String			| **optional** <p>Query to search.</p>							|
| page			| Number			| **optional** <p>Page number.</p>							|
| limit			| Number			| **optional** <p>Amount of returned items.</p>							|
| sort			| String[]			| **optional** <p>Order of returned items.</p>							|
| fields			| String[]			| **optional** <p>Fields to be returned.</p>							|

## Update company taxonomies



	PUT /company_taxonomies/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| companyId			| 			|  <p>Company taxonomies's companyId.</p>							|
| taxonomies			| 			|  <p>Company taxonomies's taxonomies.</p>							|
| status			| 			|  <p>Company taxonomies's status.</p>							|

# Controversy

## Create controversy



	POST /controversies


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| datapointId			| 			|  <p>Controversy's datapointId.</p>							|
| companyId			| 			|  <p>Controversy's companyId.</p>							|
| year			| 			|  <p>Controversy's year.</p>							|
| controversyDetails			| 			|  <p>Controversy's controversyDetails.</p>							|
| submittedDate			| 			|  <p>Controversy's submittedDate.</p>							|
| response			| 			|  <p>Controversy's response.</p>							|

## Delete controversy



	DELETE /controversies/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|

## Generate controversy JSON



	GET /controversies/json/:companyId


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|

## Retrieve controversies



	GET /controversies


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| q			| String			| **optional** <p>Query to search.</p>							|
| page			| Number			| **optional** <p>Page number.</p>							|
| limit			| Number			| **optional** <p>Amount of returned items.</p>							|
| sort			| String[]			| **optional** <p>Order of returned items.</p>							|
| fields			| String[]			| **optional** <p>Fields to be returned.</p>							|

## Retrieve controversy



	GET /controversies/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|

## Update controversy



	PUT /controversies/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| datapointId			| 			|  <p>Controversy's datapointId.</p>							|
| companyId			| 			|  <p>Controversy's companyId.</p>							|
| year			| 			|  <p>Controversy's year.</p>							|
| controversyDetails			| 			|  <p>Controversy's controversyDetails.</p>							|
| submittedDate			| 			|  <p>Controversy's submittedDate.</p>							|
| response			| 			|  <p>Controversy's response.</p>							|

## Upload controversy



	POST /controversies/upload


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|

# Datapoints

## Add categoryId for datapoints



	GET /datapoints/import-from-json/categoryId


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|

## Add polarity for datapoints



	GET /datapoints/import-from-json/polarity


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|

## Create datapoints



	POST /datapoints


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| categoryId			| 			|  <p>Datapoints's categoryId.</p>							|
| name			| 			|  <p>Datapoints's name.</p>							|
| code			| 			|  <p>Datapoints's code.</p>							|
| description			| 			|  <p>Datapoints's description.</p>							|
| polarity			| 			|  <p>Datapoints's polarity.</p>							|
| dataCollection			| 			|  <p>Datapoints's dataCollection.</p>							|
| dataCollectionGuide			| 			|  <p>Datapoints's dataCollectionGuide.</p>							|
| normalizedBy			| 			|  <p>Datapoints's normalizedBy.</p>							|
| weighted			| 			|  <p>Datapoints's weighted.</p>							|
| relevantForIndia			| 			|  <p>Datapoints's relevantForIndia.</p>							|
| standaloneOrMatrix			| 			|  <p>Datapoints's standaloneOrMatrix.</p>							|
| reference			| 			|  <p>Datapoints's reference.</p>							|
| industryRelevant			| 			|  <p>Datapoints's industryRelevant.</p>							|
| unit			| 			|  <p>Datapoints's unit.</p>							|
| signal			| 			|  <p>Datapoints's signal.</p>							|
| percentile			| 			|  <p>Datapoints's percentile.</p>							|
| finalUnit			| 			|  <p>Datapoints's finalUnit.</p>							|
| keyIssueId			| 			|  <p>Datapoints's keyIssueId.</p>							|
| functionId			| 			|  <p>Datapoints's functionId.</p>							|
| dpType			| 			|  <p>Datapoints's dpType.</p>							|

## Delete datapoints



	DELETE /datapoints/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|

## Retrieve datapoints



	GET /datapoints


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| q			| String			| **optional** <p>Query to search.</p>							|
| page			| Number			| **optional** <p>Page number.</p>							|
| limit			| Number			| **optional** <p>Amount of returned items.</p>							|
| sort			| String[]			| **optional** <p>Order of returned items.</p>							|
| fields			| String[]			| **optional** <p>Fields to be returned.</p>							|

## Update datapoints



	PUT /datapoints/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| categoryId			| 			|  <p>Datapoints's categoryId.</p>							|
| name			| 			|  <p>Datapoints's name.</p>							|
| code			| 			|  <p>Datapoints's code.</p>							|
| description			| 			|  <p>Datapoints's description.</p>							|
| dataCollection			| 			|  <p>Datapoints's dataCollection.</p>							|
| polarity			| 			|  <p>Datapoints's polarity.</p>							|
| dataCollectionGuide			| 			|  <p>Datapoints's dataCollectionGuide.</p>							|
| normalizedBy			| 			|  <p>Datapoints's normalizedBy.</p>							|
| weighted			| 			|  <p>Datapoints's weighted.</p>							|
| relevantForIndia			| 			|  <p>Datapoints's relevantForIndia.</p>							|
| standaloneOrMatrix			| 			|  <p>Datapoints's standaloneOrMatrix.</p>							|
| reference			| 			|  <p>Datapoints's reference.</p>							|
| industryRelevant			| 			|  <p>Datapoints's industryRelevant.</p>							|
| unit			| 			|  <p>Datapoints's unit.</p>							|
| signal			| 			|  <p>Datapoints's signal.</p>							|
| percentile			| 			|  <p>Datapoints's percentile.</p>							|
| finalUnit			| 			|  <p>Datapoints's finalUnit.</p>							|
| keyIssueId			| 			|  <p>Datapoints's keyIssueId.</p>							|
| functionId			| 			|  <p>Datapoints's functionId.</p>							|
| dpType			| 			|  <p>Datapoints's dpType.</p>							|
| dpStatus			| 			|  <p>Datapoints's dpStatus.</p>							|
| status			| 			|  <p>Datapoints's status.</p>							|

# DerivedDatapoints

## Calculate derived datapoints for a company



	GET /derived_datapoints/calculate/:companyId


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|

## Create derived datapoints



	POST /derived_datapoints


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| companyId			| 			|  <p>Derived datapoints's companyId.</p>							|
| datapointId			| 			|  <p>Derived datapoints's datapointId.</p>							|
| response			| 			|  <p>Derived datapoints's response.</p>							|
| memberName			| 			|  <p>Derived datapoints's memberName.</p>							|
| year			| 			|  <p>Derived datapoints's year.</p>							|

## Delete derived datapoints



	DELETE /derived_datapoints/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|

## Generate JSON



	GET /derived_datapoints/generate-json/:companyId


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|

## Retrieve derived datapoints



	GET /derived_datapoints


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| q			| String			| **optional** <p>Query to search.</p>							|
| page			| Number			| **optional** <p>Page number.</p>							|
| limit			| Number			| **optional** <p>Amount of returned items.</p>							|
| sort			| String[]			| **optional** <p>Order of returned items.</p>							|
| fields			| String[]			| **optional** <p>Fields to be returned.</p>							|

## Update derived datapoints



	PUT /derived_datapoints/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| companyId			| 			|  <p>Derived datapoints's companyId.</p>							|
| datapointId			| 			|  <p>Derived datapoints's datapointId.</p>							|
| response			| 			|  <p>Derived datapoints's response.</p>							|
| performanceResult			| 			|  <p>Derived datapoints's performanceResult.</p>							|
| memberName			| 			|  <p>Derived datapoints's memberName.</p>							|
| activeStatus			| 			|  <p>Derived datapoints's activeStatus.</p>							|
| dpStatus			| 			|  <p>Derived datapoints's dpStatus.</p>							|
| year			| 			|  <p>Derived datapoints's year.</p>							|
| fiscalYearEndDate			| 			|  <p>Derived datapoints's fiscalYearEndDate.</p>							|
| lastModifiedDate			| 			|  <p>Derived datapoints's lastModifiedDate.</p>							|
| status			| 			|  <p>Derived datapoints's status.</p>							|

# Employees

## Create employees



	POST /employees


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| userId			| 			|  <p>Employees's userId.</p>							|
| firstName			| 			|  <p>Employees's firstName.</p>							|
| middleName			| 			|  <p>Employees's middleName.</p>							|
| lastName			| 			|  <p>Employees's lastName.</p>							|
| panNumber			| 			|  <p>Employees's panNumber.</p>							|
| aadhaarNumber			| 			|  <p>Employees's aadhaarNumber.</p>							|
| bankAccountNumber			| 			|  <p>Employees's bankAccountNumber.</p>							|
| bankIFSCCode			| 			|  <p>Employees's bankIFSCCode.</p>							|
| accountHolderName			| 			|  <p>Employees's accountHolderName.</p>							|
| pancardUrl			| 			|  <p>Employees's pancardUrl.</p>							|
| aadhaarUrl			| 			|  <p>Employees's aadhaarUrl.</p>							|
| cancelledChequeUrl			| 			|  <p>Employees's cancelledChequeUrl.</p>							|
| status			| 			|  <p>Employees's status.</p>							|

## Delete employees



	DELETE /employees/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|

## Retrieve employees



	GET /employees


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| q			| String			| **optional** <p>Query to search.</p>							|
| page			| Number			| **optional** <p>Page number.</p>							|
| limit			| Number			| **optional** <p>Amount of returned items.</p>							|
| sort			| String[]			| **optional** <p>Order of returned items.</p>							|
| fields			| String[]			| **optional** <p>Fields to be returned.</p>							|

## Update employees



	PUT /employees/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| userId			| 			|  <p>Employees's userId.</p>							|
| firstName			| 			|  <p>Employees's firstName.</p>							|
| middleName			| 			|  <p>Employees's middleName.</p>							|
| lastName			| 			|  <p>Employees's lastName.</p>							|
| panNumber			| 			|  <p>Employees's panNumber.</p>							|
| aadhaarNumber			| 			|  <p>Employees's aadhaarNumber.</p>							|
| bankAccountNumber			| 			|  <p>Employees's bankAccountNumber.</p>							|
| bankIFSCCode			| 			|  <p>Employees's bankIFSCCode.</p>							|
| accountHolderName			| 			|  <p>Employees's accountHolderName.</p>							|
| pancardUrl			| 			|  <p>Employees's pancardUrl.</p>							|
| aadhaarUrl			| 			|  <p>Employees's aadhaarUrl.</p>							|
| cancelledChequeUrl			| 			|  <p>Employees's cancelledChequeUrl.</p>							|
| status			| 			|  <p>Employees's status.</p>							|

# Error

## Create error



	POST /errors


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| errorType			| 			|  <p>Error's errorType.</p>							|
| errorBucket			| 			|  <p>Error's errorBucket.</p>							|
| errorDefenition			| 			|  <p>Error's errorDefenition.</p>							|
| status			| 			|  <p>Error's status.</p>							|

## Delete error



	DELETE /errors/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|

## Retrieve error



	GET /errors/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|

## Retrieve errors



	GET /errors


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| q			| String			| **optional** <p>Query to search.</p>							|
| page			| Number			| **optional** <p>Page number.</p>							|
| limit			| Number			| **optional** <p>Amount of returned items.</p>							|
| sort			| String[]			| **optional** <p>Order of returned items.</p>							|
| fields			| String[]			| **optional** <p>Fields to be returned.</p>							|

## Update error



	PUT /errors/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| errorType			| 			|  <p>Error's errorType.</p>							|
| errorBucket			| 			|  <p>Error's errorBucket.</p>							|
| errorDefenition			| 			|  <p>Error's errorDefenition.</p>							|
| status			| 			|  <p>Error's status.</p>							|

# ErrorDetails

## Create error details



	POST /errorDetails


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| errorTypeId			| 			|  <p>Error details's errorTypeId.</p>							|
| taskId			| 			|  <p>Error details's taskId.</p>							|
| loggedBy			| 			|  <p>Error details's loggedBy.</p>							|
| comments			| 			|  <p>Error details's comments.</p>							|
| errorLoggedDate			| 			|  <p>Error details's errorLoggedDate.</p>							|
| errorStatus			| 			|  <p>Error details's errorStatus.</p>							|
| standaloneId			| 			|  <p>Error details's standaloneId.</p>							|

## Delete error details



	DELETE /errorDetails/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|

## Retrieve error details



	GET /errorDetails


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| q			| String			| **optional** <p>Query to search.</p>							|
| page			| Number			| **optional** <p>Page number.</p>							|
| limit			| Number			| **optional** <p>Amount of returned items.</p>							|
| sort			| String[]			| **optional** <p>Order of returned items.</p>							|
| fields			| String[]			| **optional** <p>Fields to be returned.</p>							|

## Update error details



	PUT /errorDetails/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| errorTypeId			| 			|  <p>Error details's errorTypeId.</p>							|
| taskId			| 			|  <p>Error details's taskId.</p>							|
| loggedBy			| 			|  <p>Error details's loggedBy.</p>							|
| comments			| 			|  <p>Error details's comments.</p>							|
| errorLoggedDate			| 			|  <p>Error details's errorLoggedDate.</p>							|
| errorStatus			| 			|  <p>Error details's errorStatus.</p>							|
| standaloneId			| 			|  <p>Error details's standaloneId.</p>							|
| status			| 			|  <p>Error details's status.</p>							|

# Functions

## Create functions



	POST /functions


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| functionType			| 			|  <p>Functions's functionType.</p>							|

## Delete functions



	DELETE /functions/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|

## Retrieve functions



	GET /functions


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| q			| String			| **optional** <p>Query to search.</p>							|
| page			| Number			| **optional** <p>Page number.</p>							|
| limit			| Number			| **optional** <p>Amount of returned items.</p>							|
| sort			| String[]			| **optional** <p>Order of returned items.</p>							|
| fields			| String[]			| **optional** <p>Fields to be returned.</p>							|

## Update functions



	PUT /functions/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| functionType			| 			|  <p>Functions's functionType.</p>							|
| status			| 			|  <p>Functions's status.</p>							|

# GroupAnalyst

## Create group analyst



	POST /groupAnalysts


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| userId			| 			|  <p>Group analyst's userId.</p>							|
| groupId			| 			|  <p>Group analyst's groupId.</p>							|

## Delete group analyst



	DELETE /groupAnalysts/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|

## Retrieve group analyst



	GET /groupAnalysts/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|

## Retrieve group analysts



	GET /groupAnalysts


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| q			| String			| **optional** <p>Query to search.</p>							|
| page			| Number			| **optional** <p>Page number.</p>							|
| limit			| Number			| **optional** <p>Amount of returned items.</p>							|
| sort			| String[]			| **optional** <p>Order of returned items.</p>							|
| fields			| String[]			| **optional** <p>Fields to be returned.</p>							|

## Update group analyst



	PUT /groupAnalysts/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| userId			| 			|  <p>Group analyst's userId.</p>							|
| groupId			| 			|  <p>Group analyst's groupId.</p>							|
| status			| 			|  <p>Group analyst's status.</p>							|

# Group

## Create group



	POST /groups


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| groupName			| 			|  <p>Group's groupName.</p>							|
| groupAdmin			| 			|  <p>Group's groupAdmin.</p>							|
| batchId			| 			|  <p>Group's batchId.</p>							|

## Delete group



	DELETE /groups/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|

## Retrieve group



	GET /groups/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|

## Retrieve groups



	GET /groups


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| q			| String			| **optional** <p>Query to search.</p>							|
| page			| Number			| **optional** <p>Page number.</p>							|
| limit			| Number			| **optional** <p>Amount of returned items.</p>							|
| sort			| String[]			| **optional** <p>Order of returned items.</p>							|
| fields			| String[]			| **optional** <p>Fields to be returned.</p>							|

## Update group



	PUT /groups/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| groupName			| 			|  <p>Group's groupName.</p>							|
| groupAdmin			| 			|  <p>Group's groupAdmin.</p>							|
| batchId			| 			|  <p>Group's batchId.</p>							|
| status			| 			|  <p>Group's status.</p>							|

# GroupQa

## Create group qa



	POST /groupQAS


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| userId			| 			|  <p>Group qa's userId.</p>							|
| groupId			| 			|  <p>Group qa's groupId.</p>							|

## Delete group qa



	DELETE /groupQAS/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|

## Retrieve group qa



	GET /groupQAS/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|

## Retrieve group qas



	GET /groupQAS


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| q			| String			| **optional** <p>Query to search.</p>							|
| page			| Number			| **optional** <p>Page number.</p>							|
| limit			| Number			| **optional** <p>Amount of returned items.</p>							|
| sort			| String[]			| **optional** <p>Order of returned items.</p>							|
| fields			| String[]			| **optional** <p>Fields to be returned.</p>							|

## Update group qa



	PUT /groupQAS/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| userId			| 			|  <p>Group qa's userId.</p>							|
| groupId			| 			|  <p>Group qa's groupId.</p>							|
| status			| 			|  <p>Group qa's status.</p>							|

# KeyIssues

## Create key issues



	POST /key_issues


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>admin access token.</p>							|
| keyIssueName			| 			|  <p>Key issues's keyIssueName.</p>							|
| keyIssueCode			| 			|  <p>Key issues's keyIssueCode.</p>							|
| keyIssueDescription			| 			|  <p>Key issues's keyIssueDescription.</p>							|
| themeId			| 			|  <p>Key issues's themeId.</p>							|

## Delete key issues



	DELETE /key_issues/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>admin access token.</p>							|

## Retrieve key issues



	GET /key_issues


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| q			| String			| **optional** <p>Query to search.</p>							|
| page			| Number			| **optional** <p>Page number.</p>							|
| limit			| Number			| **optional** <p>Amount of returned items.</p>							|
| sort			| String[]			| **optional** <p>Order of returned items.</p>							|
| fields			| String[]			| **optional** <p>Fields to be returned.</p>							|

## Update key issues



	PUT /key_issues/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>admin access token.</p>							|
| keyIssueName			| 			|  <p>Key issues's keyIssueName.</p>							|
| keyIssueCode			| 			|  <p>Key issues's keyIssueCode.</p>							|
| keyIssueDescription			| 			|  <p>Key issues's keyIssueDescription.</p>							|
| themeId			| 			|  <p>Key issues's themeId.</p>							|
| status			| 			|  <p>Key issues's status.</p>							|

# Kmp

## Create kmp



	POST /kmp


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| companyId			| 			|  <p>Kmp's companyId.</p>							|
| kmpMemberName			| 			|  <p>Kmp's kmpMemberName.</p>							|
| memberStatus			| 			|  <p>Kmp's memberStatus.</p>							|
| year			| 			|  <p>Kmp's year.</p>							|

## Delete kmp



	DELETE /kmp/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|

## Retrieve kmp



	GET /kmp/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|

## Retrieve kmps



	GET /kmp


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| q			| String			| **optional** <p>Query to search.</p>							|
| page			| Number			| **optional** <p>Page number.</p>							|
| limit			| Number			| **optional** <p>Amount of returned items.</p>							|
| sort			| String[]			| **optional** <p>Order of returned items.</p>							|
| fields			| String[]			| **optional** <p>Fields to be returned.</p>							|

## Update kmp



	PUT /kmp/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| companyId			| 			|  <p>Kmp's companyId.</p>							|
| kmpMemberName			| 			|  <p>Kmp's kmpMemberName.</p>							|
| memberStatus			| 			|  <p>Kmp's memberStatus.</p>							|
| year			| 			|  <p>Kmp's year.</p>							|
| status			| 			|  <p>Kmp's status.</p>							|

# KmpMatrixDataPoints

## Create kmp matrix data points



	POST /kmpMatrixDataPoints


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| companyId			| 			|  <p>Kmp matrix data points's companyId.</p>							|
| memberName			| 			|  <p>Kmp matrix data points's memberName.</p>							|
| datapointId			| 			|  <p>Kmp matrix data points's datapointId.</p>							|
| response			| 			|  <p>Kmp matrix data points's response.</p>							|
| year			| 			|  <p>Kmp matrix data points's year.</p>							|
| fiscalYearEndDate			| 			|  <p>Kmp matrix data points's fiscalYearEndDate.</p>							|
| memberStatus			| 			|  <p>Kmp matrix data points's memberStatus.</p>							|

## Delete kmp matrix data points



	DELETE /kmpMatrixDataPoints/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|

## Retrieve kmp matrix data points



	GET /kmpMatrixDataPoints


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| q			| String			| **optional** <p>Query to search.</p>							|
| page			| Number			| **optional** <p>Page number.</p>							|
| limit			| Number			| **optional** <p>Amount of returned items.</p>							|
| sort			| String[]			| **optional** <p>Order of returned items.</p>							|
| fields			| String[]			| **optional** <p>Fields to be returned.</p>							|

## Update kmp matrix data points



	PUT /kmpMatrixDataPoints/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| companyId			| 			|  <p>Kmp matrix data points's companyId.</p>							|
| memberName			| 			|  <p>Kmp matrix data points's memberName.</p>							|
| datapointId			| 			|  <p>Kmp matrix data points's datapointId.</p>							|
| response			| 			|  <p>Kmp matrix data points's response.</p>							|
| year			| 			|  <p>Kmp matrix data points's year.</p>							|
| fiscalYearEndDate			| 			|  <p>Kmp matrix data points's fiscalYearEndDate.</p>							|
| memberStatus			| 			|  <p>Kmp matrix data points's memberStatus.</p>							|
| status			| 			|  <p>Kmp matrix data points's status.</p>							|

# MasterTaxonomy

## Create master taxonomy



	POST /masterTaxonomies


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| fields			| 			|  <p>Master taxonomy's fields.</p>							|

## Delete master taxonomy



	DELETE /masterTaxonomies/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|

## Retrieve master taxonomies



	GET /masterTaxonomies


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| q			| String			| **optional** <p>Query to search.</p>							|
| page			| Number			| **optional** <p>Page number.</p>							|
| limit			| Number			| **optional** <p>Amount of returned items.</p>							|
| sort			| String[]			| **optional** <p>Order of returned items.</p>							|
| fields			| String[]			| **optional** <p>Fields to be returned.</p>							|

## Retrieve master taxonomy



	GET /masterTaxonomies/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|

## Update master taxonomy



	PUT /masterTaxonomies/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| fields			| 			|  <p>Master taxonomy's fields.</p>							|

# PasswordReset

## Send email



	POST /password-resets


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| email			| String			|  <p>Email address to receive the password reset token.</p>							|
| link			| String			|  <p>Link to redirect user.</p>							|

## Submit password



	PUT /password-resets/:token


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| password			| String			|  <p>User's new password.</p>							|

## Verify token



	GET /password-resets/:token


# PolarityRules

## Create polarity rules



	POST /polarity_rules


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| polarityName			| 			|  <p>Polarity rules's polarityName.</p>							|
| polarityValue			| 			|  <p>Polarity rules's polarityValue.</p>							|
| condition			| 			|  <p>Polarity rules's condition.</p>							|
| datapointId			| 			|  <p>Polarity rules's datapointId.</p>							|
| status			| 			|  <p>Polarity rules's status.</p>							|

## Delete polarity rules



	DELETE /polarity_rules/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|

## Retrieve percentile calculation



	GET /polarity_rules/calculate_percentile/:nic


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|

## Retrieve polarity rules



	GET /polarity_rules


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| q			| String			| **optional** <p>Query to search.</p>							|
| page			| Number			| **optional** <p>Page number.</p>							|
| limit			| Number			| **optional** <p>Amount of returned items.</p>							|
| sort			| String[]			| **optional** <p>Order of returned items.</p>							|
| fields			| String[]			| **optional** <p>Fields to be returned.</p>							|

## Update polarity rules



	PUT /polarity_rules/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| polarityName			| 			|  <p>Polarity rules's polarityName.</p>							|
| polarityValue			| 			|  <p>Polarity rules's polarityValue.</p>							|
| condition			| 			|  <p>Polarity rules's condition.</p>							|
| datapointId			| 			|  <p>Polarity rules's datapointId.</p>							|
| status			| 			|  <p>Polarity rules's status.</p>							|

# Reference

## Create reference



	POST /references


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| standaloneId			| 			|  <p>Reference's standaloneId.</p>							|
| sourceName			| 			|  <p>Reference's sourceName.</p>							|
| url			| 			|  <p>Reference's url.</p>							|
| pageNumber			| 			|  <p>Reference's pageNumber.</p>							|
| publicationDate			| 			|  <p>Reference's publicationDate.</p>							|
| textSnippet			| 			|  <p>Reference's textSnippet.</p>							|
| screenshotInPNG			| 			|  <p>Reference's screenshotInPNG.</p>							|
| screenshotType			| 			|  <p>Reference's screenshotType.</p>							|
| filePath			| 			|  <p>Reference's filePath.</p>							|
| activeStatus			| 			|  <p>Reference's activeStatus.</p>							|

## Delete reference



	DELETE /references/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|

## Retrieve reference



	GET /references/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|

## Retrieve references



	GET /references


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| q			| String			| **optional** <p>Query to search.</p>							|
| page			| Number			| **optional** <p>Page number.</p>							|
| limit			| Number			| **optional** <p>Amount of returned items.</p>							|
| sort			| String[]			| **optional** <p>Order of returned items.</p>							|
| fields			| String[]			| **optional** <p>Fields to be returned.</p>							|

## Update reference



	PUT /references/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| standaloneId			| 			|  <p>Reference's standaloneId.</p>							|
| sourceName			| 			|  <p>Reference's sourceName.</p>							|
| url			| 			|  <p>Reference's url.</p>							|
| pageNumber			| 			|  <p>Reference's pageNumber.</p>							|
| publicationDate			| 			|  <p>Reference's publicationDate.</p>							|
| textSnippet			| 			|  <p>Reference's textSnippet.</p>							|
| screenshotInPNG			| 			|  <p>Reference's screenshotInPNG.</p>							|
| screenshotType			| 			|  <p>Reference's screenshotType.</p>							|
| filePath			| 			|  <p>Reference's filePath.</p>							|
| activeStatus			| 			|  <p>Reference's activeStatus.</p>							|
| status			| 			|  <p>Reference's status.</p>							|

# Role

## Create role



	POST /role


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>master access token.</p>							|
| roleName			| 			|  <p>Role's roleName.</p>							|
| roleCode			| 			|  <p>Role's roleCode.</p>							|

## Delete role



	DELETE /role/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>admin access token.</p>							|

## Retrieve role



	GET /role/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|

## Retrieve roles



	GET /role


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| q			| String			| **optional** <p>Query to search.</p>							|
| page			| Number			| **optional** <p>Page number.</p>							|
| limit			| Number			| **optional** <p>Amount of returned items.</p>							|
| sort			| String[]			| **optional** <p>Order of returned items.</p>							|
| fields			| String[]			| **optional** <p>Fields to be returned.</p>							|

## Update role



	PUT /role/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>admin access token.</p>							|
| roleName			| 			|  <p>Role's roleName.</p>							|
| roleCode			| 			|  <p>Role's roleCode.</p>							|
| status			| 			|  <p>Role's status.</p>							|

# Rules

## Create rules



	POST /rules


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| methodName			| 			|  <p>Rules's methodName.</p>							|
| methodType			| 			|  <p>Rules's methodType.</p>							|
| criteria			| 			|  <p>Rules's criteria.</p>							|
| parameter			| 			|  <p>Rules's parameter.</p>							|
| datapointId			| 			|  <p>Rules's datapointId.</p>							|
| aidDPLogic			| 			|  <p>Rules's aidDPLogic.</p>							|

## Delete rules



	DELETE /rules/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|

## Retrieve rules



	GET /rules


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| q			| String			| **optional** <p>Query to search.</p>							|
| page			| Number			| **optional** <p>Page number.</p>							|
| limit			| Number			| **optional** <p>Amount of returned items.</p>							|
| sort			| String[]			| **optional** <p>Order of returned items.</p>							|
| fields			| String[]			| **optional** <p>Fields to be returned.</p>							|

## Update rules



	PUT /rules/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| methodName			| 			|  <p>Rules's methodName.</p>							|
| methodType			| 			|  <p>Rules's methodType.</p>							|
| criteria			| 			|  <p>Rules's criteria.</p>							|
| parameter			| 			|  <p>Rules's parameter.</p>							|
| datapointId			| 			|  <p>Rules's datapointId.</p>							|
| aidDPLogic			| 			|  <p>Rules's aidDPLogic.</p>							|
| status			| 			|  <p>Rules's status.</p>							|

# StandaloneDatapoints

## Create standalone datapoints



	POST /standalone_datapoints


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| companyId			| 			|  <p>Standalone datapoints's companyId.</p>							|
| datapointId			| 			|  <p>Standalone datapoints's datapointId.</p>							|
| performanceResult			| 			|  <p>Standalone datapoints's performanceResult.</p>							|
| response			| 			|  <p>Standalone datapoints's response.</p>							|
| year			| 			|  <p>Standalone datapoints's year.</p>							|
| fiscalYearEndDate			| 			|  <p>Standalone datapoints's fiscalYearEndDate.</p>							|
| standaloneStatus			| 			|  <p>Standalone datapoints's standaloneStatus.</p>							|
| taskId			| 			|  <p>Standalone datapoints's taskId.</p>							|
| submittedBy			| 			|  <p>Standalone datapoints's submittedBy.</p>							|
| submittedDate			| 			|  <p>Standalone datapoints's submittedDate.</p>							|
| activeStatus			| 			|  <p>Standalone datapoints's activeStatus.</p>							|
| lastModifiedDate			| 			|  <p>Standalone datapoints's lastModifiedDate.</p>							|
| modifiedBy			| 			|  <p>Standalone datapoints's modifiedBy.</p>							|
| isSubmitted			| 			|  <p>Standalone datapoints's isSubmitted.</p>							|

## Delete standalone datapoints



	DELETE /standalone_datapoints/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|

## Retrieve standalone datapoints



	GET /standalone_datapoints


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| q			| String			| **optional** <p>Query to search.</p>							|
| page			| Number			| **optional** <p>Page number.</p>							|
| limit			| Number			| **optional** <p>Amount of returned items.</p>							|
| sort			| String[]			| **optional** <p>Order of returned items.</p>							|
| fields			| String[]			| **optional** <p>Fields to be returned.</p>							|

## Update standalone datapoints



	PUT /standalone_datapoints/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| companyId			| 			|  <p>Standalone datapoints's companyId.</p>							|
| datapointId			| 			|  <p>Standalone datapoints's datapointId.</p>							|
| performanceResult			| 			|  <p>Standalone datapoints's performanceResult.</p>							|
| response			| 			|  <p>Standalone datapoints's response.</p>							|
| year			| 			|  <p>Standalone datapoints's year.</p>							|
| fiscalYearEndDate			| 			|  <p>Standalone datapoints's fiscalYearEndDate.</p>							|
| standaloneStatus			| 			|  <p>Standalone datapoints's standaloneStatus.</p>							|
| taskId			| 			|  <p>Standalone datapoints's taskId.</p>							|
| submittedBy			| 			|  <p>Standalone datapoints's submittedBy.</p>							|
| submittedDate			| 			|  <p>Standalone datapoints's submittedDate.</p>							|
| activeStatus			| 			|  <p>Standalone datapoints's activeStatus.</p>							|
| lastModifiedDate			| 			|  <p>Standalone datapoints's lastModifiedDate.</p>							|
| modifiedBy			| 			|  <p>Standalone datapoints's modifiedBy.</p>							|
| isSubmitted			| 			|  <p>Standalone datapoints's isSubmitted.</p>							|
| status			| 			|  <p>Standalone datapoints's status.</p>							|

## Upload Company ESG files



	POST /standalone_datapoints/upload-company-esg


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|

# TaskAssignment

## Create task assignment



	POST /taskAssignments


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| companyId			| 			|  <p>Task assignment's companyId.</p>							|
| categoryId			| 			|  <p>Task assignment's categoryId.</p>							|
| groupId			| 			|  <p>Task assignment's groupId.</p>							|
| revisionCode			| 			|  <p>Task assignment's revisionCode.</p>							|
| assignedTo			| 			|  <p>Task assignment's assignedTo.</p>							|
| year			| 			|  <p>Task assignment's year.</p>							|
| analystSLA			| 			|  <p>Task assignment's analystSLA.</p>							|
| taskStatus			| 			|  <p>Task assignment's taskStatus.</p>							|
| analystId			| 			|  <p>Task assignment's analystId.</p>							|
| qaId			| 			|  <p>Task assignment's qaId.</p>							|

## Delete task assignment



	DELETE /taskAssignments/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|

## Retrieve task assignment



	GET /taskAssignments/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|

## Retrieve task assignments



	GET /taskAssignments


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| q			| String			| **optional** <p>Query to search.</p>							|
| page			| Number			| **optional** <p>Page number.</p>							|
| limit			| Number			| **optional** <p>Amount of returned items.</p>							|
| sort			| String[]			| **optional** <p>Order of returned items.</p>							|
| fields			| String[]			| **optional** <p>Fields to be returned.</p>							|

## Update task assignment



	PUT /taskAssignments/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| companyId			| 			|  <p>Task assignment's companyId.</p>							|
| categoryId			| 			|  <p>Task assignment's categoryId.</p>							|
| groupId			| 			|  <p>Task assignment's groupId.</p>							|
| revisionCode			| 			|  <p>Task assignment's revisionCode.</p>							|
| assignedTo			| 			|  <p>Task assignment's assignedTo.</p>							|
| year			| 			|  <p>Task assignment's year.</p>							|
| analystSLA			| 			|  <p>Task assignment's analystSLA.</p>							|
| taskStatus			| 			|  <p>Task assignment's taskStatus.</p>							|
| analystId			| 			|  <p>Task assignment's analystId.</p>							|
| qaId			| 			|  <p>Task assignment's qaId.</p>							|
| status			| 			|  <p>Task assignment's status.</p>							|

# TaskSlaLog

## Create task sla log



	POST /taskSlaLogs


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| taskId			| 			|  <p>Task sla log's taskId.</p>							|
| currentDate			| 			|  <p>Task sla log's currentDate.</p>							|
| preferedDate			| 			|  <p>Task sla log's preferedDate.</p>							|
| loggedBy			| 			|  <p>Task sla log's loggedBy.</p>							|
| taskStatus			| 			|  <p>Task sla log's taskStatus.</p>							|

## Delete task sla log



	DELETE /taskSlaLogs/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|

## Retrieve task sla log



	GET /taskSlaLogs/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|

## Retrieve task sla logs



	GET /taskSlaLogs


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| q			| String			| **optional** <p>Query to search.</p>							|
| page			| Number			| **optional** <p>Page number.</p>							|
| limit			| Number			| **optional** <p>Amount of returned items.</p>							|
| sort			| String[]			| **optional** <p>Order of returned items.</p>							|
| fields			| String[]			| **optional** <p>Fields to be returned.</p>							|

## Update task sla log



	PUT /taskSlaLogs/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| taskId			| 			|  <p>Task sla log's taskId.</p>							|
| currentDate			| 			|  <p>Task sla log's currentDate.</p>							|
| preferedDate			| 			|  <p>Task sla log's preferedDate.</p>							|
| loggedBy			| 			|  <p>Task sla log's loggedBy.</p>							|
| taskStatus			| 			|  <p>Task sla log's taskStatus.</p>							|
| status			| 			|  <p>Task sla log's status.</p>							|

# Taxonomies

## Create taxonomies



	POST /taxonomies


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| name			| 			|  <p>Taxonomies's name.</p>							|
| description			| 			|  <p>Taxonomies's description.</p>							|

## Delete taxonomies



	DELETE /taxonomies/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|

## Retrieve taxonomies



	GET /taxonomies


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| q			| String			| **optional** <p>Query to search.</p>							|
| page			| Number			| **optional** <p>Page number.</p>							|
| limit			| Number			| **optional** <p>Amount of returned items.</p>							|
| sort			| String[]			| **optional** <p>Order of returned items.</p>							|
| fields			| String[]			| **optional** <p>Fields to be returned.</p>							|

## Update taxonomies



	PUT /taxonomies/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| name			| 			|  <p>Taxonomies's name.</p>							|
| description			| 			|  <p>Taxonomies's description.</p>							|
| status			| 			|  <p>Taxonomies's status.</p>							|

# Themes

## Create themes



	POST /themes


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>admin access token.</p>							|
| themeName			| 			|  <p>Themes's themeName.</p>							|
| themeCode			| 			|  <p>Themes's themeCode.</p>							|
| themeDescription			| 			|  <p>Themes's themeDescription.</p>							|
| categoryId			| 			|  <p>Themes's categoryId.</p>							|

## Delete themes



	DELETE /themes/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>admin access token.</p>							|

## Retrieve themes



	GET /themes


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| q			| String			| **optional** <p>Query to search.</p>							|
| page			| Number			| **optional** <p>Page number.</p>							|
| limit			| Number			| **optional** <p>Amount of returned items.</p>							|
| sort			| String[]			| **optional** <p>Order of returned items.</p>							|
| fields			| String[]			| **optional** <p>Fields to be returned.</p>							|

## Update themes



	PUT /themes/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>admin access token.</p>							|
| themeName			| 			|  <p>Themes's themeName.</p>							|
| themeCode			| 			|  <p>Themes's themeCode.</p>							|
| themeDescription			| 			|  <p>Themes's themeDescription.</p>							|
| categoryId			| 			|  <p>Themes's categoryId.</p>							|
| status			| 			|  <p>Themes's status.</p>							|

# User

## Create user



	POST /users


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>Master access_token.</p>							|
| email			| String			|  <p>User's email.</p>							|
| password			| String			|  <p>User's password.</p>							|
| name			| String			| **optional** <p>User's name.</p>							|
| picture			| String			| **optional** <p>User's picture.</p>							|
| roleId			| String			| **optional** <p>User's roleId.</p>							|
| role			| String			| **optional** <p>User's role.</p>							|

## Delete user



	DELETE /users/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>User access_token.</p>							|

## Onboard new user



	POST /users/new-onboard


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>User access_token.</p>							|
| email			| String			|  <p>User's email.</p>							|
| password			| String			|  <p>User's password.</p>							|
| name			| String			| **optional** <p>User's name.</p>							|
| picture			| String			| **optional** <p>User's picture.</p>							|
| roleId			| String			| **optional** <p>User's roleId.</p>							|
| role			| String			| **optional** <p>User's role.</p>							|

## Retrieve current user



	GET /users/me


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>User access_token.</p>							|

## Retrieve user



	GET /users/:id


## Retrieve users



	GET /users


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>User access_token.</p>							|
| q			| String			| **optional** <p>Query to search.</p>							|
| page			| Number			| **optional** <p>Page number.</p>							|
| limit			| Number			| **optional** <p>Amount of returned items.</p>							|
| sort			| String[]			| **optional** <p>Order of returned items.</p>							|
| fields			| String[]			| **optional** <p>Fields to be returned.</p>							|

## Retrieve users approvals



	GET /users/approvals/:isUserApproved


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>User access_token.</p>							|
| q			| String			| **optional** <p>Query to search.</p>							|
| page			| Number			| **optional** <p>Page number.</p>							|
| limit			| Number			| **optional** <p>Amount of returned items.</p>							|
| sort			| String[]			| **optional** <p>Order of returned items.</p>							|
| fields			| String[]			| **optional** <p>Fields to be returned.</p>							|

## Retrieve users by role



	GET /users/:role


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>User access_token.</p>							|
| q			| String			| **optional** <p>Query to search.</p>							|
| page			| Number			| **optional** <p>Page number.</p>							|
| limit			| Number			| **optional** <p>Amount of returned items.</p>							|
| sort			| String[]			| **optional** <p>Order of returned items.</p>							|
| fields			| String[]			| **optional** <p>Fields to be returned.</p>							|

## Update password



	PUT /users/:id/password

### Headers

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| Authorization			| String			|  <p>Basic authorization with email and password.</p>							|

### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| password			| String			|  <p>User's new password.</p>							|

## Update user



	PUT /users/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>User access_token.</p>							|
| name			| String			| **optional** <p>User's name.</p>							|
| picture			| String			| **optional** <p>User's picture.</p>							|
| roleId			| String			| **optional** <p>User's roleId.</p>							|

## Update user status



	PUT /users/update-status


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>User access_token.</p>							|
| _id			| String			| **optional** <p>User's userId.</p>							|
| isUserApproved			| Boolean			| **optional** <p>User's isUserApproved.</p>							|
| comments			| String			| **optional** <p>User's comments.</p>							|

# ValidationRules

## Create validation rules



	POST /validation_rules


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| ruleName			| 			|  <p>Validation rules's ruleName.</p>							|
| condition			| 			|  <p>Validation rules's condition.</p>							|
| criteria			| 			|  <p>Validation rules's criteria.</p>							|
| minimumValue			| 			|  <p>Validation rules's minimumValue.</p>							|
| maximumValue			| 			|  <p>Validation rules's maximumValue.</p>							|
| dependantDPCodes			| 			|  <p>Validation rules's dependantDPCodes.</p>							|
| datapointId			| 			|  <p>Validation rules's datapointId.</p>							|
| status			| 			|  <p>Validation rules's status.</p>							|

## Delete validation rules



	DELETE /validation_rules/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|

## Retrieve validation rules



	GET /validation_rules


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| q			| String			| **optional** <p>Query to search.</p>							|
| page			| Number			| **optional** <p>Page number.</p>							|
| limit			| Number			| **optional** <p>Amount of returned items.</p>							|
| sort			| String[]			| **optional** <p>Order of returned items.</p>							|
| fields			| String[]			| **optional** <p>Fields to be returned.</p>							|

## Update validation rules



	PUT /validation_rules/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| ruleName			| 			|  <p>Validation rules's ruleName.</p>							|
| condition			| 			|  <p>Validation rules's condition.</p>							|
| criteria			| 			|  <p>Validation rules's criteria.</p>							|
| minimumValue			| 			|  <p>Validation rules's minimumValue.</p>							|
| maximumValue			| 			|  <p>Validation rules's maximumValue.</p>							|
| dependantDPCodes			| 			|  <p>Validation rules's dependantDPCodes.</p>							|
| datapointId			| 			|  <p>Validation rules's datapointId.</p>							|
| status			| 			|  <p>Validation rules's status.</p>							|

# Validations

## Create validations



	POST /validations


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| datapointId			| 			|  <p>Validations's datapointId.</p>							|
| validationRule			| 			|  <p>Validations's validationRule.</p>							|
| rule			| 			|  <p>Validations's rule.</p>							|
| dependantCode			| 			|  <p>Validations's dependantCode.</p>							|
| condition			| 			|  <p>Validations's condition.</p>							|
| criteria			| 			|  <p>Validations's criteria.</p>							|
| validationAlert			| 			|  <p>Validations's validationAlert.</p>							|

## Delete validations



	DELETE /validations/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|

## Retrieve validations



	GET /validations


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| q			| String			| **optional** <p>Query to search.</p>							|
| page			| Number			| **optional** <p>Page number.</p>							|
| limit			| Number			| **optional** <p>Amount of returned items.</p>							|
| sort			| String[]			| **optional** <p>Order of returned items.</p>							|
| fields			| String[]			| **optional** <p>Fields to be returned.</p>							|

## Update validations



	PUT /validations/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| datapointId			| 			|  <p>Validations's datapointId.</p>							|
| validationRule			| 			|  <p>Validations's validationRule.</p>							|
| rule			| 			|  <p>Validations's rule.</p>							|
| dependantCode			| 			|  <p>Validations's dependantCode.</p>							|
| condition			| 			|  <p>Validations's condition.</p>							|
| criteria			| 			|  <p>Validations's criteria.</p>							|
| validationAlert			| 			|  <p>Validations's validationAlert.</p>							|
| status			| 			|  <p>Validations's status.</p>							|

# Ztables

## Create ztables



	POST /ztables


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| zScore			| 			|  <p>Ztables's zScore.</p>							|
| values			| 			|  <p>Ztables's values.</p>							|

## Delete ztables



	DELETE /ztables/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|

## Retrieve ztables



	GET /ztables


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| q			| String			| **optional** <p>Query to search.</p>							|
| page			| Number			| **optional** <p>Page number.</p>							|
| limit			| Number			| **optional** <p>Amount of returned items.</p>							|
| sort			| String[]			| **optional** <p>Order of returned items.</p>							|
| fields			| String[]			| **optional** <p>Fields to be returned.</p>							|

## Update ztables



	PUT /ztables/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| zScore			| 			|  <p>Ztables's zScore.</p>							|
| values			| 			|  <p>Ztables's values.</p>							|
| status			| 			|  <p>Ztables's status.</p>							|


