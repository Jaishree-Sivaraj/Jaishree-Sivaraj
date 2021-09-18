# esgapi v0.0.0



- [Auth](#auth)
	- [Authenticate](#authenticate)
	- [AuthenticateOTP](#authenticateotp)
	
- [Batches](#batches)
	- [Create batches](#create-batches)
	- [Create batches from UI](#create-batches-from-ui)
	- [Delete batches](#delete-batches)
	- [Retrieve batches](#retrieve-batches)
	- [Retrieve unassigned batches](#retrieve-unassigned-batches)
	- [Update batches](#update-batches)
	- [Update batch from UI](#update-batch-from-ui)
	
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
	- [Create client taxonomy from UI](#create-client-taxonomy-from-ui)
	- [Delete client taxonomy](#delete-client-taxonomy)
	- [Retrieve client taxonomies](#retrieve-client-taxonomies)
	- [Retrieve client taxonomy](#retrieve-client-taxonomy)
	- [Update client taxonomy](#update-client-taxonomy)
	- [Update client taxonomy from UI](#update-client-taxonomy-from-ui)
	
- [Companies](#companies)
	- [Create companies](#create-companies)
	- [Delete companies](#delete-companies)
	- [Retrieve companies](#retrieve-companies)
	- [Retrieve All unassingned companies of taxonomy](#retrieve-all-unassingned-companies-of-taxonomy)
	- [Retrieve NIC](#retrieve-nic)
	- [Update companies](#update-companies)
	- [Update company members](#update-company-members)
	- [Create companies](#create-companies)
	
- [CompaniesTasks](#companiestasks)
	- [Create companies tasks](#create-companies-tasks)
	- [Delete companies tasks](#delete-companies-tasks)
	- [Retrieve companies tasks](#retrieve-companies-tasks)
	- [Update companies tasks](#update-companies-tasks)
	
- [CompanyRepresentatives](#companyrepresentatives)
	- [Create company representatives](#create-company-representatives)
	- [Delete company representatives](#delete-company-representatives)
	- [Retrieve company representatives](#retrieve-company-representatives)
	- [Update company representatives](#update-company-representatives)
	
- [CompanySources](#companysources)
	- [Create company sources](#create-company-sources)
	- [Delete company sources](#delete-company-sources)
	- [Retrieve company sources](#retrieve-company-sources)
	- [Update company sources](#update-company-sources)
	
- [Controversy](#controversy)
	- [Add New controversy](#add-new-controversy)
	- [Create controversy](#create-controversy)
	- [Delete controversy](#delete-controversy)
	- [Fetch Controversy for a datapoint](#fetch-controversy-for-a-datapoint)
	- [Generate controversy JSON](#generate-controversy-json)
	- [Retrieve controversies](#retrieve-controversies)
	- [Retrieve controversy](#retrieve-controversy)
	- [Update controversy](#update-controversy)
	- [Update controversy from UI](#update-controversy-from-ui)
	- [Upload controversy](#upload-controversy)
	
- [ControversyTaskHistories](#controversytaskhistories)
	- [Create controversy task histories](#create-controversy-task-histories)
	- [Delete controversy task histories](#delete-controversy-task-histories)
	- [Retrieve controversy task histories](#retrieve-controversy-task-histories)
	- [Update controversy task histories](#update-controversy-task-histories)
	
- [ControversyTasks](#controversytasks)
	- [Create controversy tasks](#create-controversy-tasks)
	- [Delete controversy tasks](#delete-controversy-tasks)
	- [Retrieve controversy tasks](#retrieve-controversy-tasks)
	- [Retrieve my pending controversy tasks](#retrieve-my-pending-controversy-tasks)
	- [Update controversy task](#update-controversy-task)
	- [Update controversy tasks](#update-controversy-tasks)
	
- [Dashboards](#dashboards)
	- [Retrieve dashboards](#retrieve-dashboards)
	
- [Datapoints](#datapoints)
	- [Add categoryId for datapoints](#add-categoryid-for-datapoints)
	- [Add extraKeys for datapoints](#add-extrakeys-for-datapoints)
	- [Add polarity for datapoints](#add-polarity-for-datapoints)
	- [Create datapoints](#create-datapoints)
	- [Delete datapoints](#delete-datapoints)
	- [Get categorywise datapoints](#get-categorywise-datapoints)
	- [Retrieve datapoints](#retrieve-datapoints)
	- [Update datapoints](#update-datapoints)
	- [Upload datapoints for a taxonomy](#upload-datapoints-for-a-taxonomy)
	- [Get datapoints details](#get-datapoints-details)
	
- [DerivedDatapoints](#deriveddatapoints)
	- [Calculate derived datapoints for a company](#calculate-derived-datapoints-for-a-company)
	- [Create derived datapoints](#create-derived-datapoints)
	- [Delete derived datapoints](#delete-derived-datapoints)
	- [Generate JSON](#generate-json)
	- [Retrieve derived datapoints](#retrieve-derived-datapoints)
	- [Update derived datapoints](#update-derived-datapoints)
	- [Update derived datapoints of AUDR002 for a NIC](#update-derived-datapoints-of-audr002-for-a-nic)
	
- [Employees](#employees)
	- [Create employees](#create-employees)
	- [Delete employees](#delete-employees)
	- [Retrieve employees](#retrieve-employees)
	- [Update employees](#update-employees)
	
- [ErrorDetails](#errordetails)
	- [Create error details](#create-error-details)
	- [Delete error details](#delete-error-details)
	- [Retrieve error details](#retrieve-error-details)
	- [Update error details](#update-error-details)
	
- [Errors](#errors)
	- [Create error](#create-error)
	- [Delete error](#delete-error)
	- [Retrieve error](#retrieve-error)
	- [Retrieve errors](#retrieve-errors)
	- [Update error](#update-error)
	
- [Functions](#functions)
	- [Create functions](#create-functions)
	- [Delete functions](#delete-functions)
	- [Retrieve functions](#retrieve-functions)
	- [Update functions](#update-functions)
	
- [Group](#group)
	- [Create group](#create-group)
	- [Create group from UI](#create-group-from-ui)
	- [Delete group](#delete-group)
	- [Retrieve group by id](#retrieve-group-by-id)
	- [Retrieve groups](#retrieve-groups)
	- [Update group](#update-group)
	- [Update group from UI](#update-group-from-ui)
	
- [JsonFiles](#jsonfiles)
	- [Create json files](#create-json-files)
	- [Delete json files](#delete-json-files)
	- [Retrieve json files](#retrieve-json-files)
	- [Update json files](#update-json-files)
	
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
	
- [Notifications](#notifications)
	- [Create notifications](#create-notifications)
	- [Delete notifications](#delete-notifications)
	- [Retrieve My notifications](#retrieve-my-notifications)
	- [Retrieve notifications](#retrieve-notifications)
	- [Update notifications](#update-notifications)
	
- [PasswordReset](#passwordreset)
	- [Send email](#send-email)
	- [Submit password](#submit-password)
	- [Verify token](#verify-token)
	
- [PolarityRules](#polarityrules)
	- [Add Extra Keys](#add-extra-keys)
	- [Create polarity rules](#create-polarity-rules)
	- [Delete polarity rules](#delete-polarity-rules)
	- [Retrieve mock percentile calculation](#retrieve-mock-percentile-calculation)
	- [Retrieve percentile calculation](#retrieve-percentile-calculation)
	- [Retrieve polarity rules](#retrieve-polarity-rules)
	- [Update polarity rules](#update-polarity-rules)
	
- [ProjectedValues](#projectedvalues)
	- [Create projected values](#create-projected-values)
	- [Delete projected values](#delete-projected-values)
	- [Retrieve projected values](#retrieve-projected-values)
	- [Update projected values](#update-projected-values)
	
- [Role](#role)
	- [Create role](#create-role)
	- [Delete role](#delete-role)
	- [Retrieve role](#retrieve-role)
	- [Retrieve roles](#retrieve-roles)
	- [Update role](#update-role)
	
- [Rules](#rules)
	- [Add extra-keys for rules](#add-extra-keys-for-rules)
	- [Create rules](#create-rules)
	- [Delete rules](#delete-rules)
	- [Retrieve rules](#retrieve-rules)
	- [Update rules](#update-rules)
	
- [SourceSubTypes](#sourcesubtypes)
	- [Create source sub types](#create-source-sub-types)
	- [Delete source sub types](#delete-source-sub-types)
	- [Retrieve source sub types](#retrieve-source-sub-types)
	- [Update source sub types](#update-source-sub-types)
	
- [SourceTypes](#sourcetypes)
	- [Create source types](#create-source-types)
	- [Delete source types](#delete-source-types)
	- [Retrieve source types](#retrieve-source-types)
	- [Update source types](#update-source-types)
	
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
	- [Retrieve my task assignments](#retrieve-my-task-assignments)
	- [Update task assignment](#update-task-assignment)
	
- [TaskHistories](#taskhistories)
	- [Create task histories](#create-task-histories)
	- [Delete task histories](#delete-task-histories)
	- [Retrieve task histories](#retrieve-task-histories)
	- [Update task histories](#update-task-histories)
	
- [TaskSlaLog](#taskslalog)
	- [Create task sla log](#create-task-sla-log)
	- [Delete task sla log](#delete-task-sla-log)
	- [Request for extension of task sla date](#request-for-extension-of-task-sla-date)
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
	- [Upload EmailsFile](#upload-emailsfile)
	- [Onboard new user](#onboard-new-user)
	- [Retrieve current user](#retrieve-current-user)
	- [Retrieve user](#retrieve-user)
	- [Retrieve users](#retrieve-users)
	- [Retrieve users approvals](#retrieve-users-approvals)
	- [Retrieve User by roles](#retrieve-user-by-roles)
	- [send onboarding links](#send-onboarding-links)
	- [Update password](#update-password)
	- [Update user](#update-user)
	- [Update user roles](#update-user-roles)
	- [Update user status](#update-user-status)
	- [to get](#to-get)
	- [user filter](#user-filter)
	
- [UserPillarAssignments](#userpillarassignments)
	- [Create user pillar assignments](#create-user-pillar-assignments)
	- [Delete user pillar assignments](#delete-user-pillar-assignments)
	- [Retrieve user pillar assignments](#retrieve-user-pillar-assignments)
	- [Update user pillar assignments](#update-user-pillar-assignments)
	- [User pillar assignments from UI](#user-pillar-assignments-from-ui)
	
- [ValidationRules](#validationrules)
	- [Create validation rules](#create-validation-rules)
	- [Delete validation rules](#delete-validation-rules)
	- [Retrieve validation rules](#retrieve-validation-rules)
	- [Update validation rules](#update-validation-rules)
	
- [Validations](#validations)
	- [Create validations](#create-validations)
	- [Delete validations](#delete-validations)
	- [](#)
	- [Type3 Validations](#type3-validations)
	- [Type8 Validations](#type8-validations)
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

## AuthenticateOTP



	POST /auth/auth-otp


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>Master access_token.</p>							|
| email			| String			|  <p>User's email.</p>							|
| otp			| String			|  <p>User's otp.</p>							|

# Batches

## Create batches



	POST /batches


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| clientTaxonomy			| 			|  <p>Batches's clientTaxonomy.</p>							|
| batchName			| 			|  <p>Batches's batchName.</p>							|
| years			| 			|  <p>Batches's years.</p>							|
| companiesList			| 			|  <p>Batches's companiesList.</p>							|

## Create batches from UI



	POST /batches/create


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| taxonomy			| 			|  <p>Batches's taxonomy.</p>							|
| batchName			| 			|  <p>Batches's batchName.</p>							|
| years			| 			|  <p>Batches's years.</p>							|
| companies			| 			|  <p>Batches's companies.</p>							|

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

## Retrieve unassigned batches



	GET /batches/all/unassigned


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
| clientTaxonomy			| 			|  <p>Batches's clientTaxonomy.</p>							|
| batchName			| 			|  <p>Batches's batchName.</p>							|
| years			| 			|  <p>Batches's years.</p>							|
| companiesList			| 			|  <p>Batches's companiesList.</p>							|
| status			| 			|  <p>Batches's status.</p>							|

## Update batch from UI



	PUT /batches/update/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| taxonomy			| 			|  <p>Batches's taxonomy.</p>							|
| batchName			| 			|  <p>Batches's batchName.</p>							|
| years			| 			|  <p>Batches's years.</p>							|
| companies			| 			|  <p>Batches's companies.</p>							|
| status			| 			|  <p>Batches's status.</p>							|

# BoardMembers

## Create board members



	POST /boardMembers


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| companyId			| 			|  <p>Board members's companyId.</p>							|
| memberName			| 			|  <p>Board members's name.</p>							|
| startDate			| 			|  <p>Board members's startDate.</p>							|
| dob			| 			|  <p>Board members's dob.</p>							|
| gender			| 			|  <p>Board members's Gender.</p>							|
| nationality			| 			|  <p>Board members's Nationality.</p>							|
| industrialExp			| 			|  <p>Board members's IndustryExperience.</p>							|
| financialExp			| 			|  <p>Board members's FinanicialExpertise.</p>							|
| endDateTimeStamp			| 			|  <p>EndDate TimeStamp</p>							|

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
| BOSP004			| 			|  <p>Board members's name.</p>							|
| startDate			| 			|  <p>Board members's startDate.</p>							|
| dob			| 			|  <p>Board members's dob.</p>							|
| BODR005			| 			|  <p>Board members's Gender.</p>							|
| BODP001			| 			|  <p>Board members's Nationality.</p>							|
| BOSP005			| 			|  <p>Board members's IndustryExperience.</p>							|
| BOSP006			| 			|  <p>Board members's FinanicialExpertise.</p>							|
| endDateTimeStamp			| 			|  <p>EndDate TimeStamp</p>							|

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
| clientTaxonomyId			| 			|  <p>Categories's clientTaxonomyId.</p>							|

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
| clientTaxonomyId			| 			|  <p>Categories's clientTaxonomyId.</p>							|

# ClientRepresentatives

## Create client representatives



	POST /client-representatives


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| userId			| 			|  <p>Client representatives's userId.</p>							|
| name			| 			|  <p>Client representatives's name.</p>							|
| CompanyName			| 			|  <p>Client representatives's CompanyName.</p>							|
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
| CompanyName			| 			|  <p>Client representatives's CompanyName.</p>							|
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

## Create client taxonomy from UI



	POST /clientTaxonomies/create


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| taxonomyName			| 			|  <p>Client taxonomy's taxonomyName.</p>							|
| headers			| 			|  <p>Client taxonomy's headers.</p>							|

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
| status			| 			|  <p>Client taxonomy's status.</p>							|

## Update client taxonomy from UI



	PUT /clientTaxonomies/update/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| taxonomyName			| 			|  <p>Client taxonomy's taxonomyName.</p>							|
| fields			| 			|  <p>Client taxonomy's fields.</p>							|
| status			| 			|  <p>Client taxonomy's status.</p>							|

# Companies

## Create companies



	POST /companies


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| clientTaxonomyId			| 			|  <p>Companies's clientTaxonomyId.</p>							|
| companyName			| 			|  <p>Companies's companyName.</p>							|
| cin			| 			|  <p>Companies's cin.</p>							|
| nicCode			| 			|  <p>Companies's nicCode.</p>							|
| nic			| 			|  <p>Companies's nic.</p>							|
| nicIndustry			| 			|  <p>Companies's nicIndustry.</p>							|
| isinCode			| 			|  <p>Companies's isinCode.</p>							|
| cmieProwessCode			| 			|  <p>Companies's cmieProwessCode.</p>							|

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
| q			| String			| **optional** <p>Query to search.</p>							|
| page			| Number			| **optional** <p>Page number.</p>							|
| limit			| Number			| **optional** <p>Amount of returned items.</p>							|
| sort			| String[]			| **optional** <p>Order of returned items.</p>							|
| fields			| String[]			| **optional** <p>Fields to be returned.</p>							|

## Retrieve All unassingned companies of taxonomy



	GET /companies/all/unassigned/:clientTaxonomyId


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
| clientTaxonomyId			| 			|  <p>Companies's clientTaxonomyId.</p>							|
| companyName			| 			|  <p>Companies's companyName.</p>							|
| cin			| 			|  <p>Companies's cin.</p>							|
| nicCode			| 			|  <p>Companies's nicCode.</p>							|
| nic			| 			|  <p>Companies's nic.</p>							|
| nicIndustry			| 			|  <p>Companies's nicIndustry.</p>							|
| isinCode			| 			|  <p>Companies's isinCode.</p>							|
| cmieProwessCode			| 			|  <p>Companies's cmieProwessCode.</p>							|
| companyMemberDetails			| 			|  <p>Companies's companyMemberDetails.</p>							|
| fiscalYearEndDate			| 			|  <p>Companies's fiscalYearEndDate.</p>							|
| fiscalYearEndMonth			| 			|  <p>Companies's fiscalYearEndMonth.</p>							|
| isAssignedToBatch			| 			|  <p>Companies's isAssignedToBatch.</p>							|
| status			| 			|  <p>Companies's status.</p>							|

## Update company members



	PUT /companies/add/member


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| companyId			| 			|  <p>Companies's companyId.</p>							|
| name			| 			|  <p>Companies's name.</p>							|
| years			| 			|  <p>Companies's years.</p>							|
| memberType			| 			|  <p>Companies's memberType.</p>							|

## Create companies



	POST /companies/upload-companies-file


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|

# CompaniesTasks

## Create companies tasks



	POST /companies_tasks


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| taskId			| 			|  <p>Companies tasks's taskId.</p>							|
| companyId			| 			|  <p>Companies tasks's companyId.</p>							|
| year			| 			|  <p>Companies tasks's year.</p>							|
| categoryId			| 			|  <p>Companies tasks's categoryId.</p>							|

## Delete companies tasks



	DELETE /companies_tasks/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|

## Retrieve companies tasks



	GET /companies_tasks


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| q			| String			| **optional** <p>Query to search.</p>							|
| page			| Number			| **optional** <p>Page number.</p>							|
| limit			| Number			| **optional** <p>Amount of returned items.</p>							|
| sort			| String[]			| **optional** <p>Order of returned items.</p>							|
| fields			| String[]			| **optional** <p>Fields to be returned.</p>							|

## Update companies tasks



	PUT /companies_tasks/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| taskId			| 			|  <p>Companies tasks's taskId.</p>							|
| companyId			| 			|  <p>Companies tasks's companyId.</p>							|
| year			| 			|  <p>Companies tasks's year.</p>							|
| categoryId			| 			|  <p>Companies tasks's categoryId.</p>							|
| status			| 			|  <p>Companies tasks's status.</p>							|

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

# CompanySources

## Create company sources



	POST /companySources


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| sourceTypeId			| 			|  <p>Company sources's sourceTypeId.</p>							|
| sourceurl			| 			|  <p>Company sources's sourceurl.</p>							|
| sourceFile			| 			|  <p>Company sources's sourceFile.</p>							|
| publicationDate			| 			|  <p>Company sources's publicationDate.</p>							|

## Delete company sources



	DELETE /companySources/:id


## Retrieve company sources



	GET /companySources/:id


## Update company sources



	PUT /companySources/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| sourceTypeId			| 			|  <p>Company sources's sourceTypeId.</p>							|
| sourceurl			| 			|  <p>Company sources's sourceurl.</p>							|
| sourceFile			| 			|  <p>Company sources's sourceFile.</p>							|
| publicationDate			| 			|  <p>Company sources's publicationDate.</p>							|

# Controversy

## Add New controversy



	POST /controversies/add/new-controversy


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| dpCodeId			| 			|  <p>Controversy's dpCodeId.</p>							|
| companyId			| 			|  <p>Controversy's companyId.</p>							|
| taskId			| 			|  <p>Controversy's taskId.</p>							|
| source			| 			|  <p>Controversy's source.</p>							|
| response			| 			|  <p>Controversy's response.</p>							|
| textSnippet			| 			|  <p>Controversy's textSnippet.</p>							|
| screenShot			| 			|  <p>Controversy's screenShot.</p>							|
| pageNo			| 			|  <p>Controversy's pageNo.</p>							|
| comments			| 			|  <p>Controversy's comments.</p>							|
| additionalDetails			| 			|  <p>Controversy's additionalDetails.</p>							|
| nextReviewDate			| 			|  <p>Controversy's nextReviewDate.</p>							|

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
| comments			| 			|  <p>Controversy's comments.</p>							|
| submittedDate			| 			|  <p>Controversy's submittedDate.</p>							|
| response			| 			|  <p>Controversy's response.</p>							|
| additionalDetails			| 			|  <p>Controversy's additionalDetails.</p>							|
| nextReviewDate			| 			|  <p>Controversy's nextReviewDate.</p>							|

## Delete controversy



	DELETE /controversies/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|

## Fetch Controversy for a datapoint



	GET /controversies/fetch/:companyId/:datapointId


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
| comments			| 			|  <p>Controversy's comments.</p>							|
| submittedDate			| 			|  <p>Controversy's submittedDate.</p>							|
| nextReviewDate			| 			|  <p>Controversy's nextReviewDate.</p>							|
| response			| 			|  <p>Controversy's response.</p>							|
| additionalDetails			| 			|  <p>Controversy's additionalDetails.</p>							|

## Update controversy from UI



	PUT /controversies/update/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| datapointId			| 			|  <p>Controversy's datapointId.</p>							|
| companyId			| 			|  <p>Controversy's companyId.</p>							|
| year			| 			|  <p>Controversy's year.</p>							|
| controversyDetails			| 			|  <p>Controversy's controversyDetails.</p>							|
| comments			| 			|  <p>Controversy's comments.</p>							|
| submittedDate			| 			|  <p>Controversy's submittedDate.</p>							|
| nextReviewDate			| 			|  <p>Controversy's nextReviewDate.</p>							|
| response			| 			|  <p>Controversy's response.</p>							|
| additionalDetails			| 			|  <p>Controversy's additionalDetails.</p>							|

## Upload controversy



	POST /controversies/upload


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|

# ControversyTaskHistories

## Create controversy task histories



	POST /controversy_task_histories


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| taskId			| 			|  <p>Controversy task histories's taskId.</p>							|
| companyId			| 			|  <p>Cotories's companyId.</p>							|
| analystId			| 			|  <p>Controversy task hid.</p>							|
| stage			| 			|  <p>Controversy task histories's stage.</p>							|
| status			| 			|  <p>Controversy task histories's status.</p>							|
| createdBy			| 			|  <p>Controversy task histories's createdBy.</p>							|

## Delete controversy task histories



	DELETE /controversy_task_histories/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|

## Retrieve controversy task histories



	GET /controversy_task_histories


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| q			| String			| **optional** <p>Query to search.</p>							|
| page			| Number			| **optional** <p>Page number.</p>							|
| limit			| Number			| **optional** <p>Amount of returned items.</p>							|
| sort			| String[]			| **optional** <p>Order of returned items.</p>							|
| fields			| String[]			| **optional** <p>Fields to be returned.</p>							|

## Update controversy task histories



	PUT /controversy_task_histories/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| taskId			| 			|  <p>Controversy task histories's taskId.</p>							|
| companyId			| 			|  <p>Controversy task histories's companyId.</p>							|
| analystId			| 			|  <p>Controversy task histories's analystId.</p>							|
| stage			| 			|  <p>Controversy task histories's stage.</p>							|
| status			| 			|  <p>Controversy task histories's status.</p>							|
| createdBy			| 			|  <p>Controversy task histories's createdBy.</p>							|

# ControversyTasks

## Create controversy tasks



	POST /controversy_tasks


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| taskNumber			| 			|  <p>Controversy tasks's taskNumber.</p>							|
| companyId			| 			|  <p>Controversy tasks's companyId.</p>							|
| analystId			| 			|  <p>Controversy tasks's analystId.</p>							|
| taskStatus			| 			|  <p>Controversy tasks's taskStatus.</p>							|
| completedDate			| 			|  <p>Controversy tasks's completedDate.</p>							|
| status			| 			|  <p>Controversy tasks's status.</p>							|

## Delete controversy tasks



	DELETE /controversy_tasks/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|

## Retrieve controversy tasks



	GET /controversy_tasks


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| q			| String			| **optional** <p>Query to search.</p>							|
| page			| Number			| **optional** <p>Page number.</p>							|
| limit			| Number			| **optional** <p>Amount of returned items.</p>							|
| sort			| String[]			| **optional** <p>Order of returned items.</p>							|
| fields			| String[]			| **optional** <p>Fields to be returned.</p>							|

## Retrieve my pending controversy tasks



	GET /controversy_tasks/my/pending-tasks


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| q			| String			| **optional** <p>Query to search.</p>							|
| page			| Number			| **optional** <p>Page number.</p>							|
| limit			| Number			| **optional** <p>Amount of returned items.</p>							|
| sort			| String[]			| **optional** <p>Order of returned items.</p>							|
| fields			| String[]			| **optional** <p>Fields to be returned.</p>							|

## Update controversy task



	POST /controversy_tasks/update-task


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| analyst			| 			|  <p>Controversy tasks's analyst.</p>							|
| company			| 			|  <p>Controversy tasks's company.</p>							|

## Update controversy tasks



	PUT /controversy_tasks/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| taskNumber			| 			|  <p>Controversy tasks's taskNumber.</p>							|
| companyId			| 			|  <p>Controversy tasks's companyId.</p>							|
| analystId			| 			|  <p>Controversy tasks's analystId.</p>							|
| taskStatus			| 			|  <p>Controversy tasks's taskStatus.</p>							|
| completedDate			| 			|  <p>Controversy tasks's completedDate.</p>							|
| status			| 			|  <p>Controversy tasks's status.</p>							|

# Dashboards

## Retrieve dashboards



	GET /dashboards


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| q			| String			| **optional** <p>Query to search.</p>							|
| page			| Number			| **optional** <p>Page number.</p>							|
| limit			| Number			| **optional** <p>Amount of returned items.</p>							|
| sort			| String[]			| **optional** <p>Order of returned items.</p>							|
| fields			| String[]			| **optional** <p>Fields to be returned.</p>							|

# Datapoints

## Add categoryId for datapoints



	GET /datapoints/import-from-json/categoryId


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|

## Add extraKeys for datapoints



	GET /datapoints/addExtraKeys/:clientTaxonomyId


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

## Get categorywise datapoints



	GET /datapoints/list/:taskId


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

## Upload datapoints for a taxonomy



	POST /datapoints/upload


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|

## Get datapoints details



	POST /datapoints/dpDetails


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| taskId			| 			|  <p>.</p>							|
| datapointId			| 			|  <p>Datapoints's Id.</p>							|
| memberName			| 			|  <p>Member's name.</p>							|
| memberType			| 			|  <p>Member's type.</p>							|
| access_token			| String			|  <p>user access token.</p>							|

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

## Update derived datapoints of AUDR002 for a NIC



	GET /derived_datapoints/update/audr002/:nic


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|

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

# ErrorDetails

## Create error details



	POST /errorDetails/saveErrorDetails


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| pillarId			| 			|  <p>Error details's pillarId.</p>							|
| taskId			| 			|  <p>Error details's taskId.</p>							|
| companyId			| 			|  <p>Error details's companyId.</p>							|
| dpCodeId			| 			|  <p>Error details's dpCodeId.</p>							|
| memberName			| 			|  <p>Error details's memberName.</p>							|
| memberType			| 			|  <p>Error details's memberType.</p>							|
| currentData			| 			|  <p>Error details's currentData.</p>							|

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

# Errors

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

# Group

## Create group



	POST /groups


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| groupName			| 			|  <p>Group's groupName.</p>							|
| groupAdmin			| 			|  <p>Group's groupAdmin.</p>							|
| batchList			| 			|  <p>Group's batchList.</p>							|
| assignedMembers			| 			|  <p>Group's assignedMembers.</p>							|

## Create group from UI



	POST /groups/create


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| groupId			| 			|  <p>Group's groupId.</p>							|
| grpName			| 			|  <p>Group's grpName.</p>							|
| grpAdmin			| 			|  <p>Group's grpAdmin.</p>							|
| grpMembers			| 			|  <p>Group's grpMembers.</p>							|
| assignedBatches			| 			|  <p>Group's assignedBatches.</p>							|

## Delete group



	DELETE /groups/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|

## Retrieve group by id



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
| assignedMembers			| 			|  <p>Group's assignedMembers.</p>							|
| batchList			| 			|  <p>Group's batchList.</p>							|
| status			| 			|  <p>Group's status.</p>							|

## Update group from UI



	PUT /groups/update/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| grpName			| 			|  <p>Group's grpName.</p>							|
| grpAdmin			| 			|  <p>Group's grpAdmin.</p>							|
| assignedBatches			| 			|  <p>Group's assignedBatches.</p>							|
| grpMembers			| 			|  <p>Group's grpMembers.</p>							|
| status			| 			|  <p>Group's status.</p>							|

# JsonFiles

## Create json files



	POST /json_files


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| companyId			| 			|  <p>Json files's companyId.</p>							|
| year			| 			|  <p>Json files's year.</p>							|
| type			| 			|  <p>Json files's type.</p>							|
| fileName			| 			|  <p>Json files's fileName.</p>							|
| url			| 			|  <p>Json files's url.</p>							|
| status			| 			|  <p>Json files's status.</p>							|

## Delete json files



	DELETE /json_files/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|

## Retrieve json files



	GET /json_files


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| q			| String			| **optional** <p>Query to search.</p>							|
| page			| Number			| **optional** <p>Page number.</p>							|
| limit			| Number			| **optional** <p>Amount of returned items.</p>							|
| sort			| String[]			| **optional** <p>Order of returned items.</p>							|
| fields			| String[]			| **optional** <p>Fields to be returned.</p>							|

## Update json files



	PUT /json_files/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| companyId			| 			|  <p>Json files's companyId.</p>							|
| year			| 			|  <p>Json files's year.</p>							|
| type			| 			|  <p>Json files's type.</p>							|
| fileName			| 			|  <p>Json files's fileName.</p>							|
| url			| 			|  <p>Json files's url.</p>							|
| status			| 			|  <p>Json files's status.</p>							|

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
| MASP003			| 			|  <p>Kmp's kmpMemberName.</p>							|
| startDate			| 			|  <p>Kmp's startDate.</p>							|
| endDate			| 			|  <p>Kmp's endDate.</p>							|
| endDateTimeStamp			| 			|  <p>Kmp's endDateTimeStamp.</p>							|
| dob			| 			|  <p>Kmp's dob.</p>							|
| MASR008			| 			|  <p>Kmp's gender.</p>							|

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



	GET /kmp/activeKmpMembers/:companyId


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
| MASP003			| 			|  <p>Kmp's kmpMemberName.</p>							|
| startDate			| 			|  <p>Kmp's startDate.</p>							|
| endDate			| 			|  <p>Kmp's endDate.</p>							|
| endDateTimeStamp			| 			|  <p>Kmp's endDateTimeStamp.</p>							|
| dob			| 			|  <p>Kmp's dob.</p>							|
| MASR008			| 			|  <p>Kmp's gender.</p>							|
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

# Notifications

## Create notifications



	POST /notifications


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| notifyToUser			| 			|  <p>Notifications's notifyToUser.</p>							|
| notificationType			| 			|  <p>Notifications's notificationType.</p>							|
| content			| 			|  <p>Notifications's content.</p>							|
| notificationTitle			| 			|  <p>Notifications's notificationTitle.</p>							|

## Delete notifications



	DELETE /notifications/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|

## Retrieve My notifications



	GET /notifications/my-notifications/:notifyToUser


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| q			| String			| **optional** <p>Query to search.</p>							|
| page			| Number			| **optional** <p>Page number.</p>							|
| limit			| Number			| **optional** <p>Amount of returned items.</p>							|
| sort			| String[]			| **optional** <p>Order of returned items.</p>							|
| fields			| String[]			| **optional** <p>Fields to be returned.</p>							|

## Retrieve notifications



	GET /notifications


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| q			| String			| **optional** <p>Query to search.</p>							|
| page			| Number			| **optional** <p>Page number.</p>							|
| limit			| Number			| **optional** <p>Amount of returned items.</p>							|
| sort			| String[]			| **optional** <p>Order of returned items.</p>							|
| fields			| String[]			| **optional** <p>Fields to be returned.</p>							|

## Update notifications



	PUT /notifications/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| notifyToUser			| 			|  <p>Notifications's notifyToUser.</p>							|
| notificationType			| 			|  <p>Notifications's notificationType.</p>							|
| content			| 			|  <p>Notifications's content.</p>							|
| notificationTitle			| 			|  <p>Notifications's notificationTitle.</p>							|
| isRead			| 			|  <p>Notifications's isRead.</p>							|
| status			| 			|  <p>Notifications's status.</p>							|

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

## Add Extra Keys



	GET /polarity_rules/addExtraKeys


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| q			| String			| **optional** <p>Query to search.</p>							|
| page			| Number			| **optional** <p>Page number.</p>							|
| limit			| Number			| **optional** <p>Amount of returned items.</p>							|
| sort			| String[]			| **optional** <p>Order of returned items.</p>							|
| fields			| String[]			| **optional** <p>Fields to be returned.</p>							|

## Create polarity rules



	POST /polarity_rules


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| polarityName			| 			|  <p>Polarity rules's polarityName.</p>							|
| polarityValue			| 			|  <p>Polarity rules's polarityValue.</p>							|
| condition			| 			|  <p>Polarity rules's condition. *</p>							|
| categoryId			| 			|  <p>Polarity rules's CategoryId.</p>							|
| datapointId			| 			|  <p>Polarity rules's datapointId.</p>							|
| status			| 			|  <p>Polarity rules's status.</p>							|

## Delete polarity rules



	DELETE /polarity_rules/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|

## Retrieve mock percentile calculation



	POST /mock_percentileCalculation


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| companyId			| 			|  <p>Polarity rules's companyId.</p>							|
| standardDeviation			| 			|  <p>Polarity rules's standardDeviation.</p>							|
| average			| 			|  <p>Polarity rules's average.</p>							|
| datapointId			| 			|  <p>Polarity rules's datapointId.</p>							|
| response			| 			|  <p>Polarity rules's response.</p>							|

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

# ProjectedValues

## Create projected values



	POST /projected_values


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| clientTaxonomyId			| 			|  <p>Projected values's clientTaxonomyId.</p>							|
| nicCode			| 			|  <p>Projected values's nicCode.</p>							|
| categoryId			| 			|  <p>Projected values's categoryId.</p>							|
| year			| 			|  <p>Projected values's year.</p>							|
| datapointId			| 			|  <p>Projected values's datapointId.</p>							|
| projectedStdDeviation			| 			|  <p>Projected values's projectedStdDeviation.</p>							|
| projectedAverage			| 			|  <p>Projected values's projectedAverage.</p>							|
| actualStdDeviation			| 			|  <p>Projected values's actualStdDeviation.</p>							|
| actualAverage			| 			|  <p>Projected values's actualAverage.</p>							|
| status			| 			|  <p>Projected values's status.</p>							|

## Delete projected values



	DELETE /projected_values/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|

## Retrieve projected values



	GET /projected_values


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| q			| String			| **optional** <p>Query to search.</p>							|
| page			| Number			| **optional** <p>Page number.</p>							|
| limit			| Number			| **optional** <p>Amount of returned items.</p>							|
| sort			| String[]			| **optional** <p>Order of returned items.</p>							|
| fields			| String[]			| **optional** <p>Fields to be returned.</p>							|

## Update projected values



	PUT /projected_values/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| clientTaxonomyId			| 			|  <p>Projected values's clientTaxonomyId.</p>							|
| nic			| 			|  <p>Projected values's nic.</p>							|
| categoryId			| 			|  <p>Projected values's categoryId.</p>							|
| year			| 			|  <p>Projected values's year.</p>							|
| datapointId			| 			|  <p>Projected values's datapointId.</p>							|
| projectedStdDeviation			| 			|  <p>Projected values's projectedStdDeviation.</p>							|
| projectedAverage			| 			|  <p>Projected values's projectedAverage.</p>							|
| actualStdDeviation			| 			|  <p>Projected values's actualStdDeviation.</p>							|
| actualAverage			| 			|  <p>Projected values's actualAverage.</p>							|
| status			| 			|  <p>Projected values's status.</p>							|

# Role

## Create role



	POST /role


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
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

## Add extra-keys for rules



	GET /rules/addParameterId


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| q			| String			| **optional** <p>Query to search.</p>							|
| page			| Number			| **optional** <p>Page number.</p>							|
| limit			| Number			| **optional** <p>Amount of returned items.</p>							|
| sort			| String[]			| **optional** <p>Order of returned items.</p>							|
| fields			| String[]			| **optional** <p>Fields to be returned.</p>							|

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
| dpCode			| 			|  <p>Rules's dpCode.</p>							|
| datapointId			| 			|  <p>Rules's datapointId.</p>							|
| categoryId			| 			|  <p>Rules's categoryId.</p>							|
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
| dpCode			| 			|  <p>Rules's dpCode.</p>							|
| datapointId			| 			|  <p>Rules's datapointId.</p>							|
| categoryId			| 			|  <p>Rules's categoryId.</p>							|
| aidDPLogic			| 			|  <p>Rules's aidDPLogic.</p>							|
| status			| 			|  <p>Rules's status.</p>							|

# SourceSubTypes

## Create source sub types



	POST /source_sub_types


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| subTypeName			| 			|  <p>Source sub types's subTypeName.</p>							|
| description			| 			|  <p>Source sub types's description.</p>							|
| status			| 			|  <p>Source sub types's status.</p>							|

## Delete source sub types



	DELETE /source_sub_types/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|

## Retrieve source sub types



	GET /source_sub_types


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| q			| String			| **optional** <p>Query to search.</p>							|
| page			| Number			| **optional** <p>Page number.</p>							|
| limit			| Number			| **optional** <p>Amount of returned items.</p>							|
| sort			| String[]			| **optional** <p>Order of returned items.</p>							|
| fields			| String[]			| **optional** <p>Fields to be returned.</p>							|

## Update source sub types



	PUT /source_sub_types/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| subTypeName			| 			|  <p>Source sub types's subTypeName.</p>							|
| description			| 			|  <p>Source sub types's description.</p>							|
| status			| 			|  <p>Source sub types's status.</p>							|

# SourceTypes

## Create source types



	POST /sourceTypes


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| typeName			| 			|  <p>Source types's typeName.</p>							|
| isMultiYear			| 			|  <p>Source types's isMultiYear.</p>							|
| isMultiSource			| 			|  <p>Source types's isMultiSource.</p>							|

## Delete source types



	DELETE /sourceTypes/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|

## Retrieve source types



	GET /sourceTypes


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| q			| String			| **optional** <p>Query to search.</p>							|
| page			| Number			| **optional** <p>Page number.</p>							|
| limit			| Number			| **optional** <p>Amount of returned items.</p>							|
| sort			| String[]			| **optional** <p>Order of returned items.</p>							|
| fields			| String[]			| **optional** <p>Fields to be returned.</p>							|

## Update source types



	PUT /sourceTypes/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| typeName			| 			|  <p>Source types's typeName.</p>							|
| isMultiYear			| 			|  <p>Source types's isMultiYear.</p>							|
| isMultiSource			| 			|  <p>Source types's isMultiSource.</p>							|

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
| batchId			| 			|  <p>Task assignment's batchId.</p>							|
| year			| 			|  <p>Task assignment's year.</p>							|
| analystSLA			| 			|  <p>Task assignment's analystSLA.</p>							|
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

## Retrieve my task assignments



	GET /taskAssignments/task/reports


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



	PUT /taskAssignments/updateCompanyStatus


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| companyId			| 			|  <p>Task assignment's companyId.</p>							|
| batchId			| 			|  <p>Task assignment's batchId.</p>							|
| year			| 			|  <p>Task assignment's year.</p>							|

# TaskHistories

## Create task histories



	POST /task_histories


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| taskId			| 			|  <p>Task histories's taskId.</p>							|
| companyId			| 			|  <p>Task histories's companyId.</p>							|
| categoryId			| 			|  <p>Task histories's categoryId.</p>							|
| submittedByName			| 			|  <p>Task histories's submittedByName.</p>							|
| stage			| 			|  <p>Task histories's stage.</p>							|
| comment			| 			|  <p>Task histories's comment.</p>							|
| status			| 			|  <p>Task histories's status.</p>							|
| createdBy			| 			|  <p>Task histories's createdBy.</p>							|

## Delete task histories



	DELETE /task_histories/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|

## Retrieve task histories



	GET /task_histories


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| q			| String			| **optional** <p>Query to search.</p>							|
| page			| Number			| **optional** <p>Page number.</p>							|
| limit			| Number			| **optional** <p>Amount of returned items.</p>							|
| sort			| String[]			| **optional** <p>Order of returned items.</p>							|
| fields			| String[]			| **optional** <p>Fields to be returned.</p>							|

## Update task histories



	PUT /task_histories/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| taskId			| 			|  <p>Task histories's taskId.</p>							|
| companyId			| 			|  <p>Task histories's companyId.</p>							|
| categoryId			| 			|  <p>Task histories's categoryId.</p>							|
| submittedByName			| 			|  <p>Task histories's submittedByName.</p>							|
| stage			| 			|  <p>Task histories's stage.</p>							|
| comment			| 			|  <p>Task histories's comment.</p>							|
| status			| 			|  <p>Task histories's status.</p>							|
| createdBy			| 			|  <p>Task histories's createdBy.</p>							|

# TaskSlaLog

## Create task sla log



	POST /taskSlaLogs


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| taskId			| 			|  <p>Task sla log's taskId.</p>							|
| days			| 			|  <p>Task sla log's days.</p>							|
| requestedBy			| 			|  <p>Task sla log's requestedBy.</p>							|
| isAccepted			| 			|  <p>Task sla log's isAccepted.</p>							|

## Delete task sla log



	DELETE /taskSlaLogs/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|

## Request for extension of task sla date



	POST /taskSlaLogs/slaExtensionRequest


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| taskId			| 			|  <p>Task sla log's taskId.</p>							|
| days			| 			|  <p>Task sla log's days.</p>							|
| requestedBy			| 			|  <p>Task sla log's requestedBy.</p>							|
| isAccepted			| 			|  <p>Task sla log's isAccepted.</p>							|

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
| days			| 			|  <p>Task sla log's days.</p>							|
| requestedBy			| 			|  <p>Task sla log's requestedBy.</p>							|
| isAccepted			| 			|  <p>Task sla log's isAccepted.</p>							|
| status			| 			|  <p>Task sla log's status.</p>							|

# Taxonomies

## Create taxonomies



	POST /taxonomies


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| name			| 			|  <p>Taxonomies's name.</p>							|
| fieldName			| 			|  <p>Taxonomies's fieldName.</p>							|
| applicableFor			| 			|  <p>Taxonomies's applicableFor.</p>							|
| inputType			| 			|  <p>Taxonomies's inputType.</p>							|
| inputValues			| 			|  <p>Taxonomies's inputValues.</p>							|
| toDisplay			| 			|  <p>Taxonomies's toDisplay.</p>							|

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
| fieldName			| 			|  <p>Taxonomies's fieldName.</p>							|
| applicableFor			| 			|  <p>Taxonomies's applicableFor.</p>							|
| inputType			| 			|  <p>Taxonomies's inputType.</p>							|
| inputValues			| 			|  <p>Taxonomies's inputValues.</p>							|
| toDisplay			| 			|  <p>Taxonomies's toDisplay.</p>							|
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
| email			| String			|  <p>User's email.</p>							|
| password			| String			|  <p>User's password.</p>							|
| name			| String			| **optional** <p>User's name.</p>							|
| picture			| String			| **optional** <p>User Type.</p>							|

## Delete user



	DELETE /users/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>User access_token.</p>							|

## Upload EmailsFile



	POST /user/uploadEmailsFile


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|

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

## Retrieve User by roles



	GET /users/getRoleUser


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>User access_token.</p>							|

## send onboarding links



	POST /users/new-onboard/send-mails


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| emailList			| Array			|  <p>User's emailList.</p>							|

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

## Update user roles



	PUT /users/update/roles


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>User access_token.</p>							|
| _id			| String			| **optional** <p>User's userId.</p>							|
| roleDetails			| Boolean			|  <p>User's roleDetails.</p>							|

## Update user status



	PUT /users/update-status


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>User access_token.</p>							|
| _id			| String			| **optional** <p>User's userId.</p>							|
| isUserApproved			| Boolean			| **optional** <p>User's isUserApproved.</p>							|
| comments			| String			| **optional** <p>User's comments.</p>							|

## to get



	GET /users/assign-role


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>User access_token.</p>							|
| _id			| String			| **optional** <p>User's userId.</p>							|
| isUserApproved			| Boolean			| **optional** <p>User's isUserApproved.</p>							|
| comments			| String			| **optional** <p>User's comments.</p>							|

## user filter



	POST /users/filter-user


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| filters			| Array			|  <p>User's emailList.</p>							|

# UserPillarAssignments

## Create user pillar assignments



	POST /user_pillar_assignments


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| primaryPillar			| 			|  <p>User pillar assignments's primaryPillar.</p>							|
| secondaryPillar			| 			|  <p>User pillar assignments's secondaryPillar.</p>							|
| userId			| 			|  <p>User pillar assignments's userId.</p>							|

## Delete user pillar assignments



	DELETE /user_pillar_assignments/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|

## Retrieve user pillar assignments



	GET /user_pillar_assignments


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| q			| String			| **optional** <p>Query to search.</p>							|
| page			| Number			| **optional** <p>Page number.</p>							|
| limit			| Number			| **optional** <p>Amount of returned items.</p>							|
| sort			| String[]			| **optional** <p>Order of returned items.</p>							|
| fields			| String[]			| **optional** <p>Fields to be returned.</p>							|

## Update user pillar assignments



	PUT /user_pillar_assignments/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| primaryPillar			| 			|  <p>User pillar assignments's primaryPillar.</p>							|
| secondaryPillar			| 			|  <p>User pillar assignments's secondaryPillar.</p>							|
| userId			| 			|  <p>User pillar assignments's userId.</p>							|
| status			| 			|  <p>User pillar assignments's status.</p>							|

## User pillar assignments from UI



	POST /user_pillar_assignments/create


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| primaryPillar			| 			|  <p>User pillar assignments's primaryPillar.</p>							|
| secondaryPillar			| 			|  <p>User pillar assignments's secondaryPillar.</p>							|
| userId			| 			|  <p>User pillar assignments's userId.</p>							|

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
| dpCode			| 			|  <p>Validations's dpCode.</p>							|
| clientTaxonomyId			| 			|  <p>Validations's clientTaxonomyId.</p>							|
| validationRule			| 			|  <p>Validations's validationRule.</p>							|
| dataType			| 			|  <p>Validations's dataType.</p>							|
| hasDependentCode			| 			|  <p>Validations's hasDependentCode.</p>							|
| dependentCodes			| 			|  <p>Validations's dependentCodes.</p>							|
| validationType			| 			|  <p>Validations's validationType.</p>							|
| percentileThreasholdValue			| 			|  <p>Validations's percentileThreasholdValue.</p>							|
| parameters			| 			|  <p>Validations's parameters.</p>							|
| methodName			| 			|  <p>Validations's methodName.</p>							|
| checkCondition			| 			|  <p>Validations's checkCondition.</p>							|
| criteria			| 			|  <p>Validations's criteria.</p>							|
| checkResponse			| 			|  <p>Validations's checkResponse.</p>							|
| errorMessage			| 			|  <p>Validations's errorMessage.</p>							|

## Delete validations



	DELETE /validations/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|

## 



	GET /validations/validateDpDetails/:taskId


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|

## Type3 Validations



	POST /validations/type3


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| datapointId			| 			|  <p>Validations's datapointId.</p>							|
| companyId			| 			|  <p>Validations's companyId.</p>							|
| clientTaxonomyId			| 			|  <p>Validations's clientTaxonomyId.</p>							|
| currentYear			| 			|  <p>Validations's currentYear.</p>							|
| previousYear			| 			|  <p>Validations's previousYear.</p>							|
| response			| 			|  <p>Validations's response.</p>							|

## Type8 Validations



	POST /validations/type8


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| datapointId			| 			|  <p>Validations's datapointId.</p>							|
| companyId			| 			|  <p>Validations's companyId.</p>							|
| clientTaxonomyId			| 			|  <p>Validations's clientTaxonomyId.</p>							|
| currentYear			| 			|  <p>Validations's currentYear.</p>							|
| previousYear			| 			|  <p>Validations's previousYear.</p>							|
| response			| 			|  <p>Validations's response.</p>							|

## Update validations



	PUT /validations/:id


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| access_token			| String			|  <p>user access token.</p>							|
| datapointId			| 			|  <p>Validations's datapointId.</p>							|
| validationRule			| 			|  <p>Validations's validationRule.</p>							|
| dependentCodes			| 			|  <p>Validations's dependentCodes.</p>							|
| criteria			| 			|  <p>Validations's criteria.</p>							|
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


