# FFYP FINAL - Extracted Content





AI Enabled Gym Management and Virtual Fitness System











Project ID: Fall-2025-43





Session: BSCS Fall 2022 to 2026



Project Advisor:  Sir Asif Ahsan 



Submitted By





Hifza Faisal

70135435

Fatima Faisal

70135434













Department of Computer Science & IT

The University of Lahore

Lahore, Pakistan



Declaration



We have read the project guidelines and we understand the meaning of academic dishonesty, in particular plagiarism and collusion. We hereby declare that the work we submitted for our final year project, entitled AI Enabled Gym Management and Virtual Fitness System is original work and has not been printed, published or submitted before as final year project, research work, publication or any other documentation.  





 



Group Member 1 Name: HIFZA FAISAL

SAP No: 70135435



Signature: ………………………… 











Group Member 2 Name:  FATIMA FAISAL

SAP No: 70135434



Signature: ………………………… 





























Statement of Submission



This is to certify that Hifza Faisal Roll No.70135435, Fatima Faisal Roll No.70135434 have successfully submitted the final project named as: AI Enabled Gym Management and Virtual Fitness System, at Computer Science & IT Department, The University of Lahore, Lahore Pakistan, to fulfill the partial requirement of the degree of BS in Computer Science.















Supervisor Name:  SIR ASIF AHSAN



Signature: …………………………

Date: ………………………













































Dedication



We lovingly dedicate this project to our parents whose endless love, sacrifices and prayers have been our strength at every stage of life. They are the ones who taught us to stay patient in difficult times to work hard with honesty and to never lose hope. Whatever we have achieved today is because of the foundation they built for us to their care and support. We also dedicate this work to our teachers who have been more than just mentors. Their encouragement, patience and guidance gave us the confidence to believe in ourselves and the motivation to push forward when things seemed challenging. 





































































Acknowledgement

                                                                                  

We truly acknowledge the cooperation and guidance provided by Sir Asif Ahsan, Supervisor, Department of Computer Science & IT, The University of Lahore. He has been a constant source of guidance throughout the course of this project. 

We would also like to thank our respected faculty members from the Department of Computer Science & IT, The University of Lahore for their help and guidance throughout the development of this project. 

We are also thankful to our friends and families whose silent support and encouragement led us to successfully complete our project “AI Enabled Gym Management and Virtual Fitness System.”





Date:

Jan 1, 2020

   



























 

                                                             Abstract



The increasing demand for hybrid and technology driven fitness solutions has highlighted the limitations of conventional gym management systems, which rely heavily on manual trainer user assignments, scheduling, and posture correction. The proposed project, AI Enabled Gym Management and Virtual Fitness System, aims to modernize and automate these operations through and integrated web based platform.

The primary challenge identified is the absence of a centralized digital framework in local gyms capable of efficiently allocating trainers according to their expertise, availability, and user preferences. Additionally, traditional setups lack intelligent notification and coordination mechanisms to manage trainer unavailability, resulting in mismatched pairings, missed sessions, and restricted access for remote participants.

To address these challenges, the system has been designed as a comprehensive web application consisting of three core modules Smart Trainer User Matching: Automatically pairs users with trainers based on individual fitness goals, expertise levels, and available time slots. AI-Powered Posture Estimation: Utilizes advanced pose detection algorithms to deliver real time corrective feedback during exercise sessions. Centralized Dashboards: Provides dedicated interfaces for administrators, trainers, and users to efficiently handle registrations, session scheduling, payments, and progress tracking.

The implementation of this system leads to enhanced operational efficiency, higher training quality through AI assisted posture correction, and greater accessibility via virtual training environments. Moreover, the platform supports dynamic fee calculation and scalable multi-gym deployment, enabling future growth.



























Area of the Project



Machine Leaning 

Web Application

Technologies used







HTML

CSS 

JavaScript

React.js

Node.js

Mongodb

Python

MediaPipe

 

 







































List of Figures







Figure 1 Use Case Diagram Create Account33

Figure 2 Architecture Diagram36

Figure 3 ERD37

Figure 4 Level 0 DFD38

Figure 5 Level 1 DFD39

Figure 6 Class Diagram40

Figure 7 Activity Diagram41

Figure 8 Activity Diagram User Dashboard42

Figure 9 Activity Diagram Trainer User Matching43

Figure 10 Activity Diagram Trainer Registration44

Figure 11 Activity Diagram Trainer Registration45

Figure 12 Activity Diagram Trainer Dashboard/Login46

Figure 13 Activity Diagram Combined47

Figure 14 Sequence Diagram Create Account48

Figure 15 Sequence Diagram Student Booking & Smart Matching49

Figure 16 Sequence Diagram AI-Assisted Virtual Session50

Figure 17 Collaboration Diagram51

Figure 18 State Transition Diagram58

Figure 19 Component Diagram59

Figure 20 Deployment Diagram60



































List of Tables



 

Table 1 Comparative Analysis6

Table 2 Functional Requirement User Registration14

Table 3 Functional Requirement Trainer Registration14

Table 4 Functional Requirement User Login15

Table 5 Functional Requirement Trainer Login15

Table 6 Functional Requirement Trainer User Matching16

Table 7 Functional Requirement Session Scheduling16

Table 8 Functional Requirement AI Powered Posture Estimation17

Table 9 Functional Requirement Live Online Session17

Table 10 Functional Requirement Admin Dashboard18

Table 11 Functional Requirement Trainer Dashboard18

Table 12 Functional Requirement User Dashboard19

Table 13 Functional Payment and Subscription Handling19

Table 14 Functional Requirement Session Tracking Logs20

Table 15 Functional Feedback and Progress Reports20

Table 16 Functional Requirement Centralized Record keeping21

Table 17 Use Case User Registration33

Table 18 Trainer Registration34

Table 19 Positive Test Case for User Registration61

Table 20 Negative Test Case for User Registration62

Table 21 Positive Test Case for Trainer Registration63

Table 22 Negative Test Case for Trainer Registration64

Table 23 Positive Test Case for User Login65

Table 24 Negative Test Case for User Login65

Table 25 Positive Test Case for Trainer Login66

Table 26 Negative Test Case for Trainer Login66

Table 27 Positive Test Case for Trainer User Matching67

Table 28 Negative Test Case for Trainer User Matching67

Table 29 Positive Test Case for Session Scheduling68

Table 30 Negative Test Case for Session Scheduling69

Table 31 Positive Test Case for AI Powered Posture Estimation70

Table 32 Negative Test Case for AI Powered Posture Estimation70

Table 33 Positive Test Case for Live Online Session71

Table 34 Negative Test Case for Live Online Session71

Table 35 Positive Test Case for Admin Dashboard72

Table 36 Negative Test Case for Admin Dashboard72

Table 37 Positive Test Case for Trainer Dashboard73

Table 38 Negative Test Case for Trainer Dashboard73

Table 39 Positive Test Case for User Dashboard74

Table 40 Negative Test Case for User Dashboard74

Table 41 Positive Test Case for Payment and Subscription Handling75

Table 42 Negative Test Case for Payment and Subscription Handling76

Table 43 Positive Test Case for Session Tracking and Logs77

Table 44 Negative Test Case for Session Tracking and Logs77

Table 45 Positive Test Case for Feedback and Progress Reports78

Table 46 Negative Test Case for Feedback and Progress Reports78

Table 47 Positive Test Case for Centralized Record Keeping79

Table 48 Negative Test Case for Centralized Record Keeping79



















Table of Content



 

Declarationi

Statement of Submissionii

Dedicationiii

Acknowledgementiv

Abstractv

List of Figuresvii

List of Tablesviii

Chapter 1:  Introduction to the Problem1

1.1Introduction1

1.2Purpose2

1.3Objective3

1.4Existing Solution6

1.5Proposed Solution7

Chapter 2:  Software Requirement Specification9

2.1Introduction9

2.1.1Purpose9

2.1.2Scope10

2.1.3Definitions, acronyms, and abbreviations11

2.2Overall description13

2.2.1Product perspective13

2.2.2Product functions14

2.2.3User characteristics21

2.2.4Constraints23

2.2.5Assumptions and dependencies25

2.2.6Apportioning of requirements26

2.3Specific requirements28

2.3.1Functional Requirement28

2.3.2Non-functional Requirements29

Chapter 3:  Use Case Analysis32

Chapter 4:  Design35

4.1Architecture Diagram36

4.2ERD with data dictionary37

4.3Data Flow diagram38

4.3.1The level 038

4.3.2The level 139

4.4Class Diagram40

4.5Activity Diagram41

4.6Sequence Diagram48

4.7Collaboration Diagram51

4.8State Transition Diagram52

4.9Component Diagram59

4.10Deployment Diagram60

Chapter 5: User Manual61

References67

Appendix68



 

 

 

 

 

 

 

 

 

 



Chapter 1: Introduction to the Problem  





  Introduction 



The fast growth of technology in the fitness industry has completely changed how people think about health and exercise. Traditional gyms that depend on manual record keeping, face-to-face training, and basic scheduling systems are now finding it difficult to keep up with the changing needs of modern users. In Pakistan, many fitness enthusiasts still face problems like unorganized training setups limited access to qualified trainers, and irregular tracking of their progress. Most local gyms rely on simple methods such as WhatsApp groups or phone calls to handle schedules, which often causes confusion missed sessions, and weak coordination between users and trainers. This lack of proper management not only lowers customer satisfaction but also creates inefficiency for both trainers and gym owners. 

With the rise of digital technology, new opportunities have emerged for fitness enthusiasts who want convenience, flexibility, and personalized training. After the COVID-19 pandemic, people have become more comfortable using online platforms for learning and training, and this trend is now spreading in the fitness field as well. Although international fitness apps like FitBot and MindBody are available they usually don’t meet local needs and often miss features such as AI powered posture estimation that can guide users in real time. This opens the door for a smart affordable solution that makes professional fitness training accessible online, maintains session continuity, and offers automatic feedback to users during workouts. 

The proposed project AI-Enabled Gym Management and Virtual Fitness System is a web based platform built to modernize online fitness training and increase user interaction. The system automatically matches trainers and users in real time based on their skill levels, training preferences, and available time slots. This reduces manual work for trainers and ensures that users are guided by the most suitable experts for their goals. It also includes an AI-powered posture estimation feature developed with frameworks like MediaPipe which provides corrective feedback on exercise form during online sessions. If a trainer is unavailable this AI module helps users continue their workouts safely and effectively without interruptions. 

Unlike traditional gyms this system is completely online. Trainers can conduct live virtual sessions while users can log in choose their preferred type of workout and train anytime. If no trainer is available the virtual AI posture system steps in and provides feedback on body alignment. This helps users maintain proper form and gain confidence even without being physically present in a gym.

 A major part of the project is its comprehensive online dashboards. Trainers can manage their schedules, check workout requests, monitor user progress, and share feedback. Users can view available trainers, book sessions, join live workouts, and see AI-generated posture reports. Administrators have access to a central management panel that keeps track of all sessions, trainer-user connections, progress reports, and payment calculations. All the data is securely saved in a central database to ensure accuracy, transparency, and scalability. 

According to market research, the need for online fitness solutions is increasing both in Pakistan and globally. The platform supports flexible business models such as pay-per-session for casual users, monthly subscriptions for regular members and premium plans for advanced features. In the future this system can also integrate with wearable fitness devices goal tracking tools and personalized diet planning turning it into a complete digital fitness ecosystem. 

This project provides an innovative solution to the challenges faced by traditional and semi-digital fitness systems. With its online-first approach and AI-based assistance, it removes the barriers of time, distance, and trainer availability. The AI-Enabled Gym Management and Virtual Fitness System combine’s web technologies, artificial intelligence, and modern software design to deliver an efficient, affordable, and future-ready platform that allows trainers to reach more clients and helps users achieve their fitness goals with expert guidance and technological support.

 Purpose 



The AI-Enabled Gym Management and Virtual Fitness System is developed with the purpose of transforming and digitizing the way fitness training is conducted and managed. It provides an integrated online platform that connects users, trainers, and administrators in a structured and interactive environment. The main objective of this project is to overcome the limitations of traditional training methods where users often experience irregular access to qualified trainers poor scheduling systems and a lack of timely feedback on their workout posture. Many fitness enthusiasts lose motivation or quit their routines due to inconsistency or the absence of proper corrective guidance while trainers face difficulties managing multiple clients without a centralized scheduling or progress-tracking system. This platform addresses these challenges by offering a smart digital solution that ensures uninterrupted training sessions, smooth trainer-user coordination and efficient activity management.

 At its foundation, the system allows users to connect with professional trainers in real time through online sessions, removing physical and geographical barriers associated with conventional gyms. The inclusion of an AI-powered posture estimation module ensures training continuity, even when a live trainer is not available. This artificial intelligent component provides instant feedback on user’s body alignment, highlights mistakes, and suggests corrections, promoting both safety and consistency. As a result, users can maintain proper exercise posture, stay motivated, and continue progressing towards their fitness goals. Additionally, the system provides users with access to detailed records such as session history, performance feedback, and progress analytics helping them monitor their improvement and stay accountable in their fitness journey. 

The project also aims to make trainer’s work more organized and productive. Trainers can specify their availability, expertise, and preferred training times, enabling the system to automatically match them with users based on compatibility and skill requirements. This automated pairing not only saves time but also eliminates the risk of scheduling conflicts and duplicate bookings. Trainers can easily track their client’s performance review AI-generated feedback and focus more on delivering high-quality instruction instead of managing administrative tasks. This allows them to reach a wider audience beyond physical gym boundaries, build stronger client relationships, and expand their professional networks efficiently. 

For administrators and gym managers, the system offers a centralized management dashboard that simplifies record keeping, payment handling, and overall operations. They can view trainer user pairings, manage subscription plans, track ongoing sessions, and calculate payments transparently. With a real-time overview of all activities, administrators can make more informed decisions and reduce the errors often caused by manual or disconnected management systems. The integration of trainer performance metrics and financial data into one unified platform enhances accountability, scalability, and operational transparency.

 Beyond solving these management challenges, the project aligns with the growing global and local demand for online fitness solutions. Unlike international platforms that offer generalized training features, this system is specifically designed to combine professional trainer availability with AI-assisted workout feedback, ensuring a more personalized and effective experience. The platform also supports flexible business models, including pay-per-session for occasional users and subscription-based access for regular members. In the future, it can be expanded with features such as wearable device integration, fitness goal tracking, and customized meal planning, creating a holistic and scalable digital fitness ecosystem.

 Ultimately, the AI-Enabled Gym Management and Virtual Fitness System aims to establish a comprehensive digital platform that emphasizes consistency, accessibility, and personalization. It not only solves current issues like session management and posture correction but also sets the foundation for future innovation in online fitness. By leveraging artificial intelligence and modern web technologies, the system ensures continuous support, connects users and trainers seamlessly and promotes efficient management at all levels. By doing this, it helps trainers reach a wider audience, empowers individuals to realize their goals, and allows administrators to efficiently manage operations.

 Objective 



The main goal of the AI-Enabled Gym Management and Virtual Fitness System is to create an online, intelligent, and user-friendly platform that transforms how fitness services are managed delivered and experienced. The project aims to build a unified digital environment where users, trainers and administrators can interact easily unlike traditional gym systems that depend on manual scheduling scattered communication and physical presence. 

The core objective of the system is to make real-time virtual training sessions possible through artificial intelligence, bridging the gap between fitness enthusiasts and professional trainers. Users will be automatically matched with trainers based on their preferences, time availability and fitness goals ensuring a more efficient and personalized experience. Along with this an AI based posture estimation module is included to analyze workout performance and provide instant corrective feedback. This feature keeps training sessions going even when a trainer is not available helping users stay safe, confident and motivated.

Another key goal is to centralize and simplify fitness management for everyone involved. Users can easily track their progress view their training history and review feedback through their dashboards. Trainers can manage their schedules accept or reject session requests and evaluate user performance systematically. Administrators can handle scheduling payments and system operations from a single control panel. By automating and digitizing these processes the system removes the need for paper-based work reduces the chances of errors and improves overall accountability and efficiency.

 A major focus of this project is also to make fitness more accessible and inclusive. Many people struggle to find affordable and reliable professional training because of location, cost, or lack of qualified trainers. This system breaks those barriers by bringing training online, allowing users to work with experts from anywhere. With flexible subscription and pay-per-session options, the platform makes it easier for both casual users and dedicated fitness enthusiasts to train according to their needs and budget. 

From a trainer’s point of view, this system improves career opportunities and client management. Trainers often face challenges in handling multiple clients and tracking progress. The platform helps solve this by offering easy scheduling, digital progress tracking, and automated trainer-user matching. This allows trainers to spend more time focusing on quality coaching while reaching a wider online audience beyond physical gym limits. 

For administrators, the goal is to enhance transparency and simplify daily operations. Using a centralized dashboard, administrators can monitor trainer assignments, manage user subscriptions, review AI-generated posture logs, and handle accurate payment calculations all in real time. This setup reduces manual effort and enables better, data-driven decision-making.

Overall, the project supports the digital transformation of the fitness industry, offering a more complete solution than existing global platforms. While many apps only provide partial features, this system combines AI posture correction, real-time trainer availability, and centralized management into one powerful platform designed for users. Its flexible structure also allows for future upgrades, such as meal planning modules, fitness goal tracking, and wearable device integration, making it scalable for long-term growth. 

The system’s ultimate vision is to become a complete digital fitness ecosystem, not just a management tool.

Develop a fully online fitness training platform with personalized trainer-user matching.

Provide AI-powered posture estimation to ensure continuous training when trainers are unavailable

Centralize management for users, trainers, and administrators to streamline scheduling, tracking, and payments.

Increase accessibility and affordability with flexible subscription and pay-per-session options

Equip administrators with real-time dashboards for transparent and efficient operations.

Support the ongoing digital evolution of the fitness industry through scalable and modern technology.

Empower trainers with better scheduling tools, digital progress tracking, and opportunities to reach broader audiences.

     Together, these goals ensure that the system not only solves the problems of traditional training but also sets a strong foundation for the future of digital fitness. By combining AI and modern web technologies, the AI-Enabled Gym Management and Virtual Fitness System aims to make fitness training more smart, inclusive, and sustainable for everyone involved.































 Existing Solution 

       Comparative Analysis







Feature 

Mindbody 

Fitbod

MyFitnessPal



Local Gym Tools (sheets)

AI Enabled Gym management (Our Solution) 

Online Session Scheduling 

✓

✓

✗

✗

✓

Trainer User Matching 

✗

✗

✗

✗

✓

AI Based Posture Estimation

✗

✗

✗

✗

✓

Live Trainer Interaction

✓

✓

✗

✓(Manual)

✓

Trainer Continuity without trainer

✗

✗

✗

✗

✓

Centralized Dashboard 

✓

✓

✗

✗

✓

Scalable For Multiple Gym

✓

✗

✗

✗

✓

Affordable forsmall gym

✗

✗

✓

✓

✓

For Local Market 

✗

✗

✗

✓

✓





                                                                      Table 1 Comparative Analysis









 Proposed Solution 



The proposed AI-Enabled Gym Management and Virtual Fitness System is a complete online platform designed to overcome the limitations of existing fitness systems by combining structured management with modern artificial intelligence. Unlike traditional gyms or current digital platforms that depend heavily on manual scheduling and lack automated corrective support this system allows users to follow structured workouts enables trainers to manage clients efficiently and gives administrators a transparent view of all operations in one place. 

A core feature of the proposed system is its AI-based posture estimation module, which provides users with real-time feedback on their exercise form through their webcam. Using advanced frameworks such as MediaPipe, the system can detect body movements identify incorrect posture and suggest immediate corrective actions. This feature ensures that users can continue their workouts effectively even when a trainer is unavailable, maintaining exercise quality and minimizing the risk of injuries caused by poor form.

Another major component is intelligent trainer-user matching, which sets this system apart from existing solutions. The platform automatically pairs users with trainers based on availability, preferred workout type, and skill level. For instance, a beginner seeking general fitness training will be matched with a basic trainer, while an advanced user aiming for muscle gain will be assigned to a specialized coach. This dynamic matching system personalizes each user’s experience, reduces scheduling conflicts, and improves the overall quality of training sessions.

The platform also provides dedicated dashboards for every type of user.

 Users can sign up, book sessions, join virtual workouts, and track their progress through feedback and posture correction logs.

 Trainers can manage their schedules, review past and upcoming sessions, and monitor user performance with system-generated insights. 

Administrators have access to a central management dashboard that combines all trainer-user assignments, session data, payment records, and analytical reports in real time.

 This centralized system enhances transparency, reduces manual errors, and supports smarter decision-making for long-term operational growth.

To ensure affordability and inclusivity, the system supports flexible business models. Users may choose between pay-per-session plans for occasional use or subscription packages for continuous access. Premium options can include personalized dashboards branded features for large organizations and affiliate marketing opportunities for fitness products. These models make the platform suitable for different audiences with varying needs and budgets while ensuring financial sustainability.

 From a technical perspective, the system is built on a cloud-based, scalable architecture that allows multiple trainers and users to interact simultaneously without performance issues. All data including session details, payment information, and posture feedback is securely stored in databases such as Firebase or PostgreSQL to ensure safety and easy retrieval. The structure also supports future expansions such as fitness goal tracking, wearable device integration, and personalized nutrition planning, paving the way for a fully developed digital fitness ecosystem.

 By filling up the main holes in the current market offerings, this solution distinguishes itself from competitors like MindBody and FitBot which provide either workout tracking or trainer management but they don’t integrate AI-powered feedback, automatic matching and centralized administration. The proposed system offers a cost-effective, user-friendly, and accessible solution specifically suited for markets like Pakistan and other developing regions where fitness technology adoption is still growing.

  

 





Chapter 2: Software Requirement Specification 





     Introduction 

Purpose 



The purpose of this Software Requirement Specification (SRS) document is to clearly define both the functional and non-functional requirements of the AI Enabled Gym Management and Virtual Fitness System. It establishes a shared understanding of the system’s objectives, scope, and expected behavior among the developers, evaluators, and all project stakeholders. By presenting an organized and systematic outline of requirements, this document ensures that the system is designed in alignment with the identified problems, proposed solutions, and project goals discussed in Chapter 1.



This SRS serves as the foundation for all subsequent stages of development, including system design, implementation, testing, and deployment. It acts as a roadmap for the development team and provides a reliable reference point for future scalability, maintenance, and quality assurance. Moreover, it functions as an agreement between the stakeholders and the development team, ensuring that all planned features, performance criteria, and technical expectations are documented before implementation. Any future enhancements or modifications can be evaluated against the baseline requirements outlined in this document.



The SRS aims to describe the system’s functionality by detailing the services, features, and interactions the platform must support such as trainer user matching, AI driven posture estimation, online session management, and centralized administration. It is written in a manner that can be easily understood by both technical and nontechnical readers, promoting clarity and a shared understanding among all parties involved. Through precise descriptions of inputs, outputs, workflows, and system constraints, the document minimizes ambiguity and reduces the likelihood of misinterpretation during the development process. Furthermore, it supports project management by establishing measurable standards through which progress, quality, and overall success can be evaluated.



In addition to defining the purpose of the SRS, it is also important to identify its intended audience. This document is prepared for several key groups, each using it differently:



Project Managers and Assessors: To ensure that the proposed system meets academic standards, industrial relevance, and Final Year Project evaluation criteria.



Developers: To use as a technical reference during the design and implementation stages, ensuring all features are developed as specified.



Quality Assurance (QA) Team: To derive test cases, scenarios, and validation procedures directly from the requirements to verify that the system meets its defined objectives.



End Users: To review documented features and confirm that the system fulfills practical needs such as session scheduling, online training, payment management, and posture correction.



Future Researchers and Developers: To use this document as a reference for future improvements, scalability, and system evolution in later versions.





Scope 



The proposed software product, titled AI Enabled Gym Management and Virtual Fitness System, is a comprehensive, web based platform designed to modernize and digitalize fitness training. It integrates real time trainer user matching, AI powered posture analysis, online session scheduling, and centralized administration to create a seamless and efficient fitness management environment. The system aims to overcome the inefficiencies of conventional gym operations and fragmented online fitness tools by offering a single, unified solution that effectively serves administrators, trainers, and end users.



To achieve these objectives, the system incorporates several key functionalities. Users can register on the platform, specify their training preferences, and book sessions with qualified trainers according to expertise, skill level, and time availability. Trainers are able to define their working hours, accept or reject session requests, and monitor user progress through session histories and feedback records. In cases where trainers are unavailable, the system provides automated assistance through an AI based posture estimation module, which utilizes computer vision algorithms to analyze body movements and deliver real time corrective feedback. Administrators, meanwhile, can oversee all operations through a centralized dashboard, managing trainer user assignments, session scheduling, payment processing, and overall performance tracking.

Although the system is designed to be comprehensive, its boundaries must be clearly defined. It does not include the management of physical gym resources such as equipment distribution, facility maintenance, or in-person attendance tracking. The initial version also excludes advanced medical diagnostics, personalized diet planning, or professional healthcare guidance, though these modules may be considered for future integration. The system functions as an intelligent virtual assistant that maintains training continuity when human trainers are unavailable rather than serving as a complete replacement for them.



The platform’s design emphasizes accessibility, dependability, and user safety. By combining session scheduling, posture correction, and progress tracking within one ecosystem, the system provides users with secure, customized, and consistent workout experiences. Trainers benefit from structured client management, reduced administrative effort, and the ability to expand their services to a wider online audience. Administrators gain improved transparency and control in monitoring sessions, handling payments, and managing platform activity. Overall, the software seeks to make professional fitness training more accessible, ensure uninterrupted AI assisted workouts, and minimize the need for manual coordination. 

The broader goals of the system align with the project’s previously defined problem statement and proposed solution. These include:

Enhancing user satisfaction by providing personalized and consistent training experiences.

Minimizing scheduling conflicts through efficient and intelligent trainer user matching.

Offering AI driven corrective feedback to improve exercise safety and effectiveness.

Delivering a scalable architecture capable of future enhancements such as diet planning, goal tracking, and wearable device integration.

Promoting the development of a Fitness as a Service (FaaS) model for broader domestic adoption.

In summary, the AI Enabled Gym Management and Virtual Fitness System aims to deliver an innovative, AI driven web solution that redefines fitness management in the digital age. It provides a cost effective, scalable, and intelligent platform that benefits users seeking expert guidance, trainers aiming for better client management, and administrators requiring simplified oversight. By defining clear objectives and boundaries for development, the system ensures focused implementation, measurable results, and a solid foundation for future growth in smart fitness solutions.





 





Definitions, acronyms, and abbreviations 



This section presents the key definitions, acronyms, and abbreviations associated with the AI Enabled Gym Management and Virtual Fitness System as outlined in the Software Requirement Specification (SRS). The purpose of this section is to ensure clarity and a unified understanding of all technical and functional terms used throughout the documentation.



Definitions:



User: An individual who registers on the platform to access online training sessions, track workout progress, and receive AI based posture correction feedback.

Trainer: A certified fitness instructor responsible for conducting online training sessions, managing availability schedules, and monitoring user progress through the platform.

Administrator (Admin): The individual responsible for overseeing overall system operations, including scheduling, trainer user allocation, and payment management.

Trainer User Matching: An automated process that assigns trainers to users based on expertise, skill level, preferred training type, and time availability.

Posture Estimation: An AI driven module that detects incorrect body posture during exercises using computer vision and provides real time corrective feedback via webcam input.

Dashboard: A centralized interface that enables administrators, trainers, and users to manage schedules, view performance metrics, and access session records efficiently.

Subscription Model: A pricing strategy in which gyms or users pay a fixed monthly fee to access the platform’s services.

Pay per Session Model: A payment structure where users pay individually for each training session, whether assisted by a trainer or through the AI posture estimation system.

Session Log: A digital record of completed sessions containing details such as trainer involvement, user progress, and posture correction feedback.



         Acronyms:

                   

AI: Artificial Intelligence

FYP: Final Year Project

UI: User Interface

UX: User Experience

DB: Database

FaaS: Fitness as a Service





           Abbreviations:



UOL: The University of Lahore

Req: Requirement

Func: Functional

Non-Func: Non-Functional

Reg: Registration       





     Overall description 

Product perspective 



The AI Enabled Gym Management and Virtual Fitness System is a web based and independent software application designed to support online fitness training and gym management activities. The system functions as a standalone platform and does not rely on any existing gym management software. It brings together users, trainers, and administrators on a single platform to manage training sessions, posture correction, scheduling, and administrative tasks in an organized manner.

Users and trainers interact with the system through web dashboards that allow them to register, book sessions, conduct online training, and monitor progress. Administrators use a centralized interface to manage users, trainers, payments, and overall system activities. The user interface is designed to be simple, responsive, and easy to understand so that individuals with basic digital skills can use it without difficulty.

The system requires commonly available hardware such as computers with webcams and microphones to support live sessions and AI based posture analysis. It uses modern web technologies and integrates external services for video communication, data storage, and posture estimation. Secure communication protocols are used to ensure safe data exchange, while centralized storage is used to maintain records of users, sessions, and feedback.

Overall, the system is designed to be scalable, easy to deploy, and adaptable to different gym environments, making it suitable for both small fitness setups and larger organizations.















Product functions 

 



ID: 

FR_01 







Name: 

User Registration 







Description 

Input 

Output 

Requirements 

Basic Work Flow 

Allows a new user to create an account in the system. 

 

Name, Email, Password, Contact Info, Fitness Goal.

Account successfully

created.

 

Internet Connectivity required.

EUser enters details →System validates data→ Saves in database → Confirmation sent. 

 

                                                       Table 2 Functional Requirement User Registration



ID: 

FR_02







Name: 

Trainer Registration







Description 

Input 

Output 

Requirements 

Basic Work Flow 

Allows trainers to register with expertise and available time slots.

 

Name, Email, Password, training type, Expertise (Beginner, Intermediate, Experts), Time Slots. 

Trainer profile required 

Internet Connectivity required 

Trainer fills form → System validates → Stores trainer profile in DB → Confirms registration.

                                            

                                                 Table 3 Functional Requirement Trainer Registration





ID: 

FR_03







Name: 

User Login 







Description 

Input 

Output 

Requirements 

Basic Work Flow 

Enables registered users to log in securely.

 

Email, Password.

User dashboard displayed.

 

Internet Connectivity required. 

User enters credentials → System Verifies → Grants access to dashboard.



                                                                    Table 4 Functional Requirement User Login

ID: 

FR_04







Name: 

Trainer Login 







Description 

Input 

Output 

Requirements 

Basic Work Flow 

Enables registered trainers to log in securely.

 

Email, Password.

Trainer dashboard displayed. 

 

Internet Connectivity required 

Trainer enters credentials → System verifies → Grants access to trainer dashboard. 



                                                          Table 5 Functional Requirement Trainer Login



                                                      















ID: 

FR_05 







Name: 

Trainer User Matching 







Description 

Input 

Output 

Requirements 

Basic Work Flow 

System automatically matches users with trainers based on expertise, preferences, and availability  

 

Users fitness goal, preferred time slot, skill level,  

Trainer assigned to user.

 

Both user and trainer must be registered.

User requests session → System compares availability & skill level → Matches trainer → Updates both dashboards.



                                                        Table 6 Functional Requirement Trainer User Matching



ID: 

FR_06







Name: 

Session Scheduling 







Description 

Input 

Output 

Requirements 

Basic Work Flow 

Allows users to book sessions with trainers at available time slots.

 

Preferred Date, Time, Training Type.

Session scheduled.

 

Trainer availability required.

User selects  slot → System checks trainer schedule → Confirms booking → Updates calendars



                                                               Table 7 Functional Requirement Session Scheduling                                             

ID: 

FR_07







Name: 

AI Powered Posture Estimation







Description 

Input 

Output 

Requirements 

Basic Work Flow 

Uses AI to analyze user posture during exercises and provide correctives

 

Webcam feed of user performing exercise.

Real time posture feedback.

 

Webcam access and internet required.

User starts workout→  AI detects posture →  identifies movement →  provides feedback on screen. 



                                            Table 8 Functional Requirement AI Powered Posture Estimation

ID: 

FR_08







Name: 

Live Online Session 







Description 

Input 

Output 

Requirements 

Basic Work Flow 

Allows trainers and users to conduct live sessions through integrated video calls.

 

Session required Video/ Audio input.

Real time communication established.

Stable internet connection required.

User join session →  Trainer accepts →  Video call starts →  Session conducted  



                                                         Table 9 Functional Requirement Live Online Session





ID: 

FR_09







Name: 

Admin Dashboard







Description 

Input 

Output 

Requirements 

Basic Work Flow 

Provides admin with tools to manage system operations

 

Admin login credentials.

Centralized view of trainers, users, sessions, payments

 

Admin rights required.

Admin logs in → Views records → Manages schedules, payments, and activities.



                                                         Table 10 Functional Requirement Admin Dashboard

                                                        

                                              



ID: 

FR_10







Name: 

Trainer Dashboard  







Description 

Input 

Output 

Requirements 

Basic Work Flow 

Displays trainer’s upcoming sessions, user assignments feedback logs. 

 

Trainer login credentials. 

Trainer dashboard loaded.

 

Trainer account required.

Trainer logs in → Views dashboard→ Manages sessions and availability.

                                                         

                                                               Table 11 Functional Requirement Trainer Dashboard







                                                     

ID: 

FR_11 







Name: 

User Dashboard







Description 

Input 

Output 

Requirements 

Basic Work Flow 

Displays users booked sessions, posture report, and progress.

 

User login credentials. 

User Dashboard loaded.

 

Active user account required 

User logs in → Views dashboard → Access session history and feedback.

         

                                                      Table 12 Functional Requirement User Dashboard







ID: 

FR_12







Name: 

Payment and subscription Handling







Description 

Input 

Output 

Requirements 

Basic Work Flow 

Manages payments for sessions or subscription.

 

Payment details (Card, Wallet).

Payments confirmation, subscription activated.

 

Secure payment gateway required.

User selects package → Enters payment info → System verifies transaction → Confirms subscription.



                                                     Table 13 Functional Payment and Subscription Handling











ID: 

FR_13







Name: 

Session Tracking & Logs







Description 

Input 

Output 

Requirements 

Basic Work Flow 

Tracks all sessions for trainers and users with details of time, feedback.

Session participation data.

Session history and log stored. 

 

Database connection required.

Session conducted → System records time → trainer, feedback → Stores in DB → Accessible in dashboards. 



                                                      Table 14 Functional Requirement Session Tracking Logs

                                                       



ID: 

FR_14







Name: 

Feedback and Progress Reports.







Description 

Input 

Output 

Requirements 

Basic Work Flow 

Provides performance reports and feedback to user after each session.

 

Post session data, AI posture feedback, Trainer notes.

User progress report generated.

 

Requires completed session.

Session ends → Trainer generates reports → User views reports in dashboard.

                                                     

                                                              Table 15 Functional Feedback and Progress Reports

ID: 

FR_15







Name: 

Centralized Recordkeeping 







Description 

Input 

Output 

Requirements 

Basic Work Flow 

Maintains a secure record of users, trainers, sessions, payments and AI logs.

 

User, Trainer Session, and payment data.

Centralized database of all records.

 

Database connectivity required.

Activities performed → Data stored in DB → Admin can retrieve or update records anytime.

                                                         

                                                            Table 16 Functional Requirement Centralized Record keeping

                                                        



User characteristics 



The AI-Enabled Gym Management and Virtual Fitness System is designed for three primary user categories: general users (trainees), trainers, and administrators. Each group interacts with the system differently and requires varying levels of technical proficiency. Understanding these user characteristics is essential to ensure that the system remains usable, accessible, and suitable for its intended audience.





            General Users (Trainees):



General users are individuals who register on the platform to receive online fitness training. They represent a diverse group that includes students, working professionals, and fitness enthusiasts of different ages and educational backgrounds. Although they may not possess advanced technical expertise, most users are familiar with basic digital operations such as creating online accounts, using web or mobile applications, and participating in video calls.



Their technical skills are typically limited to navigating user-friendly interfaces, filling out online forms, and following clear on-screen instructions. Therefore, the system must provide a simple and intuitive interface with minimal technical complexity. For example, booking a session should require only a few easy steps, and posture feedback should be displayed in a clear and visually understandable format.



From a fitness perspective, these users vary widely in skill level. Some are beginners with little or no prior experience, while others are intermediate or advanced athletes seeking professional training. The system accommodates this diversity by allowing users to specify their fitness goals and current skill levels during registration. This information supports intelligent trainer–user matching, ensuring that users are paired with trainers whose expertise aligns with their individual needs.



            Trainers:



Trainers are certified fitness professionals who conduct online sessions through the platform. Their educational qualifications may include fitness certifications or degrees in sports sciences, and they generally possess a moderate level of technical proficiency. Trainers are comfortable using digital dashboards, web applications, and video conferencing tools to schedule sessions and monitor user progress.



A key feature for trainers is an efficient trainer dashboard that simplifies administrative and management tasks. It should allow them to easily set their availability, categorize their skill level (beginner, intermediate, or expert), and review the progress of their assigned users. Because trainers may manage several clients simultaneously, the system must include clear notifications, effective scheduling tools, and access to AI generated posture feedback. These capabilities enable trainers to maintain consistent, high quality instruction without excessive manual effort.



Additionally, trainers play a vital role in evaluating AI-assisted sessions. While the posture estimation module provides automated corrective guidance, trainers are expected to review session logs, analyze user performance, and offer personalized feedback. This dual responsibility requires trainers to balance their fitness expertise with technical understanding such as reading posture correction reports or interpreting progress analytics.

 

          Administrators (Admin):



Administrators oversee the overall functioning of the platform and ensure the smooth operation of all system components. Their role is primarily managerial, though they are expected to possess sufficient familiarity with digital dashboards, data management, and scheduling systems. In most cases, administrators are gym owners, managers, or designated staff members who require centralized access to all trainer–user interactions and financial operations.

Their key responsibilities include monitoring user and trainer registrations, assigning trainers to sessions, evaluating session reports, and managing payments. While administrators are not required to have deep technical or AI-related knowledge, they must be able to navigate dashboards efficiently, extract reports, and make informed, data-driven decisions. Hence, the administrative interface must emphasize accuracy, simplicity, and usability to support effective management.

            Constraints



The development and deployment of the AI-Enabled Gym Management and Virtual Fitness System are subject to several constraints that may influence its design, implementation, and operational processes. These limitations must be carefully considered to ensure stable performance, data integrity, and compliance with relevant standards. The key constraints are described below: 



            Regulatory Policies:



The system must comply with established data protection and privacy regulations such as the General Data Protection Regulation (GDPR) for international users, along with applicable Pakistani IT and cybersecurity laws. Sensitive information, including user profiles, payment details, and fitness-related data, must be securely stored and protected from unauthorized access. No personal or financial data may be shared with third parties without explicit user consent.



            Hardware Limitations: 



The AI-driven posture estimation module depends on webcam input for accurate movement detection. Users or trainers without a functioning webcam or adequate processing hardware may experience reduced system performance. In addition, both parties must have devices capable of maintaining stable video conferencing. Poor-quality hardware can negatively affect the accuracy and responsiveness of real-time posture detection.

               

           











            Audit Functions:

The system must maintain detailed logs of payments, trainer–user interactions, and posture correction data for administrative review and accountability. These audit records must be tamper-proof and readily retrievable. This requirement places constraints on database design, storage capacity, and data retrieval speed. 



          Control Functions:

Administrative control must remain secure and role-based. The system should implement Role-Based Access Control (RBAC) to ensure that only authorized users can perform specific actions such as modifying records, approving trainers, or handling financial data. This introduces the need for robust authentication and authorization mechanisms to prevent misuse or unauthorized access.



            Higher-Order Language Requirements:

The system will be developed using modern web technologies such as React.js for the frontend, Node.js/Express for the backend, and MediaPipe for AI posture estimation. While these frameworks were chosen for their scalability and compatibility with AI components, they introduce challenges related to development complexity and the need for skilled technical expertise.



            Signal Handshake Protocols:

Real-time communication within the system relies on WebRTC protocols to establish reliable peer-to-peer connections for live video sessions and AI-based posture analysis. These protocols depend on consistent network stability and secure signaling processes to ensure smooth streaming and uninterrupted data transmission. 



            Reliability Requirements:

Because users depend on the platform for continuous online training, the system must maintain high reliability and availability. Interruptions in AI posture estimation or video conferencing modules could affect user trust. Although achieving 100% uptime may not be feasible due to resource constraints, the system must include redundancy mechanisms and fallback strategies to minimize downtime.



            Criticality of the Application:

Although the application is not life-critical, incorrect posture feedback or trainer unavailability could potentially cause physical strain, user dissatisfaction, or poor training results. Therefore, ensuring accurate AI feedback, stable scheduling, and reliable performance is essential to maintain safety and user confidence. 







            Safety and Security Considerations:

The system must guarantee data privacy and secure handling of confidential information, including payment details and personal records. All data transfers must use SSL/TLS encryption to ensure safe communication channels. Since the platform involves webcam access for AI posture detection, privacy safeguards must be implemented to prevent unauthorized access or misuse of video feeds. AI-generated data and posture records must also be securely stored and managed to avoid exploitation or data leakage.

             



Assumptions and dependencies 



The requirements of the AI-Enabled Gym Management and Virtual Fitness System are based on several assumptions and dependencies related to technology, user behavior, and third-party services. While these factors are not direct design limitations, any changes in them could influence the accuracy, performance, and overall success of the system.



Assumptions:



Internet Connectivity: It is assumed that administrators, trainers, and users will have access to a stable and reliable internet connection. Since the platform depends heavily on AI based posture detection and live video streaming, weak or unstable connectivity may affect the system’s real time performance.

Device Availability: It is expected that all users and trainers will possess compatible devices such as computers or mobile devices equipped with webcams, microphones, and modern web browsers capable of supporting the AI and video conferencing modules.

Basic Digital Literacy: Users are presumed to have basic technical skills such as creating accounts, joining video sessions, and navigating dashboards. Although the system is designed to be intuitive and easy to use, users who are completely unfamiliar with digital platforms may require additional assistance or onboarding support.

Trainer Expertise: It is assumed that all trainers registered on the platform are certified professionals qualified to provide fitness guidance. The system does not independently verify credentials beyond the details provided during registration.

User Fitness Awareness: Users are expected to be aware of their general health conditions (for example, injuries or medical restrictions) and should not depend solely on AI posture feedback for medical or therapeutic advice.

System Usage Patterns: It is anticipated that user activity will peak during regular training hours but remain within manageable limits, as the platform is designed with scalability to accommodate fluctuations in demand.



Dependencies:

Third-Party Payment Gateways: The platform depends on secure third-party payment services to process subscriptions and pay-per-session transactions. Any service interruptions or security issues in these external gateways may directly affect payment processing and user transactions.

Video Conferencing APIs: The operation of live online sessions relies on integration with real-time video communication frameworks such as WebRTC. Modifications, restrictions, or downtime in these APIs could affect the stability of trainer user interactions.

AI Frameworks: The AI posture estimation component depends on external machine learning libraries such as MediaPipe. Updates, deprecations, or errors in these frameworks may reduce the accuracy or availability of posture detection.

Database Services: The system uses cloud-based databases such as PostgreSQL for data storage and management. Any service outage, performance issue, or limitation in storage capacity could disrupt session tracking and recordkeeping.

Browser Compatibility: Core features such as AI posture detection and live video streaming require modern browsers that support WebRTC and camera access. Outdated or unsupported browsers may not deliver full functionality.

External Regulations: The system is subject to compliance with evolving data protection and privacy laws, including GDPR and local cybersecurity policies. Any changes in legal requirements may necessitate modifications in data-handling procedures and security mechanisms.





Apportioning of requirements 



The initial release of the AI-Enabled Gym Management and Virtual Fitness System will primarily focus on its core functional modules, which include trainer and user registration, automated trainer user matching, online session scheduling, AI powered posture estimation, session monitoring, and centralized dashboards. These features are considered essential for ensuring a stable, reliable, and effective platform during the first phase of implementation.



However, due to constraints related to development time, available resources, and technical complexity, several advanced functionalities will be deferred to future versions of the system. These postponed requirements are outlined below:







Personalized Diet and Meal Planning Module:

A future enhancement will introduce a comprehensive nutrition management system capable of generating customized meal and diet plans based on users’ health conditions, lifestyle, and fitness goals. This module will allow users to record daily meals and receive AI-assisted recommendations on calorie intake, macronutrient balance, and hydration reminders to support their workout routines.



Wearable Device Integration:

Upcoming versions of the system will support integration with wearable fitness devices such as smartwatches and fitness bands. This feature will enable real time data collection for parameters like heart rate, calories burned, steps taken, and sleep quality. Users will be able to synchronize their physical activity data with the platform for more precise and data-driven progress tracking.



Fitness Goal Analytics and Gamification:

A future update will include advanced fitness analytics and gamification tools to enhance user engagement and motivation. Users will be able to set long term goals such as endurance improvement, muscle development, or weight management and view detailed progress through interactive dashboards. Additionally, gamification elements such as leaderboards, achievement badges, and streak counters will be introduced to encourage consistent participation.



Multi-Language Support:

While the current version supports English as the primary language, future iterations will incorporate multi language capabilities to enhance accessibility for non-English speaking users. This feature will make the platform more inclusive and adaptable to international markets, supporting its scalability and global reach.



Integration with E-Commerce Platforms:

Future releases may introduce integration with e-commerce systems for fitness-related products such as apparel, supplements, and workout equipment. The platform could use personalized recommendations to suggest products aligned with users’ training goals, generating potential affiliate-based revenue streams for sustainability.



AI-Enhanced Trainer Assistance:

Although the current system provides AI based posture estimation, future versions aim to extend this capability to include AI driven personalized workout plan generation. Using historical data, posture analysis, and fitness goals, the system will autonomously create customized training programs, further minimizing dependency on human trainers while maintaining training quality.



Corporate and Institutional Packages:

Subsequent updates may also offer specialized packages for corporate organizations, educational institutions, and fitness communities. These packages will promote large scale fitness engagement through group session management, multi role user hierarchies, and organization specific analytics features that go beyond the scope of the initial release.



This phased distribution of requirements ensures that the system’s initial release remains practical, focused, and aligned with its primary objective streamlining trainer user coordination and maintaining session continuity through AI assistance. Advanced functionalities such as diet planning, wearable device integration, and gamification will be introduced in later versions to expand scalability, enhance market appeal, and elevate the overall user experience. This gradual enhancement strategy maintains a balance between innovation and feasibility, allowing the system to evolve progressively into a comprehensive digital fitness ecosystem.



 

 

     Specific requirements 



Functional Requirement 



The functional requirements define the core services and features that the system must support and are given below:

FR_01 User Registration: The system should allow new users to register by providing their personal details, fitness goals, and skill level.

FR_02  Trainer Registration: Trainers must be able to create profiles by specifying their availability, training category, and area of expertise.

FR_03 User Login: Users should be able to securely log in to access their personalized dashboard and training related features.

FR_04  Trainer Login: Trainers should have secure login access to manage their schedules, sessions, and assigned users.

FR_05  Trainer User Matching: The system must automatically match users with trainers based on preferences, skill levels, and trainer availability

FR_06  Session Scheduling: Users must be able to schedule sessions within available time slots offered by trainers.

FR_07  AI Powered Posture Estimation: The system should utilize webcam input to analyze user posture during exercises and provide real-time corrective feedback.

FR_08   Live Online Sessions: The platform should support integrated video conferencing to allow trainers and users to conduct live virtual training sessions.

FR_09  Admin Dashboard: Administrators should have access to a centralized control panel for managing users, trainers, sessions, and payments.

FR_10   Trainer Dashboard: Trainers should have a dashboard to view upcoming and past sessions, track user progress, and manage availability.

FR_11    User Dashboard: Users should be able to view scheduled sessions, posture feedback, and historical progress data.

FR_12   Payment and Subscription Handling: The system should support secure online payment methods and flexible subscription options for users.

FR_13  Session Tracking and Logs: All session details, including time, trainer participation, and posture correction data, must be recorded for tracking and accountability.

FR_14   Feedback and Progress Reports: After each session, users should receive detailed performance reports summarizing progress and AI-generated posture feedback.

FR_15  Centralized Recordkeeping: The system must maintain a secure and accessible repository of all users, trainers, sessions, payments, and related records.



Non-functional Requirements 



The non-functional requirements define the quality standards and operational characteristics of the AI Enabled Gym Management and Virtual Fitness System. Unlike functional requirements, these specifications describe how the system should perform rather than what it should do. They ensure that the platform remains user-friendly, reliable, efficient, scalable, and maintainable over time while adhering to professional software quality standards.

Usability:

The system should provide an intuitive and easy-to-use interface that can be efficiently navigated by administrators, trainers, and users with minimal guidance.

Navigation processes such as session booking should be simple and task oriented, ideally requiring no more than three steps.

Feedback and error notifications 

Interface layouts and design elements should remain consistent across all dashboards (user, trainer, and admin) to ensure a uniform user experience.

Reliability:

The system must guarantee at least 99% uptime availability, excluding scheduled maintenance periods.

AI-powered posture feedback must operate reliably with standard camera input under normal conditions.

Data integrity must be preserved even during concurrent user operations such as simultaneous session bookings or updates.

Regular data backups and recovery mechanisms must be implemented to prevent data loss and system failure.

Performance:

The system must support a minimum of 500 concurrent users during its initial deployment phase.

AI posture feedback should be generated within two seconds of user movement.

Average dashboard response times (for actions like scheduling or login) should not exceed three seconds.

Payment transactions through integrated gateways should complete within ten seconds to ensure a smooth user experience.

Design Constraints:

The development of the system must adhere to the following technological and design specifications:

Frontend: React.js

Backend: Node.js

Database: PostgreSQL

AI Module: MediaPipe

Maintainability:



The system’s codebase must be modular, well structured, and thoroughly documented to simplify debugging, updates, and future enhancements.

Version control must be implemented for AI models and APIs to manage updates and maintain consistency.

The architecture must support the integration of additional features such as diet planning modules or wearable device connectivity without disrupting existing functionality.

Routine maintenance tasks, such as clearing outdated logs or updating trainer availability, should be automated where possible to reduce manual effort.



Protability:



The application must be compatible with major web browsers such as Google Chrome, Microsoft Edge.

It should run seamlessly on various devices including desktops, laptops.

Future iterations of the system must support migration to alternative cloud platforms.

License Agreement:

                 

The software will initially be released as an academic project for The University of Lahore (UOL).

A formal licensing agreement will be required for any deployment or commercialization outside of academic use to protect intellectual property rights.

Third party libraries and frameworks (e.g., React.js, MediaPipe) must be used in compliance with their respective open source license terms.











 



Chapter 3: Use Case Analysis  

 

  Figure 1 Use Case Diagram Create Account



 



Use Case ID 

UC_01 

Use Case Name 

User Registration

Description 

This use case allows a new user to register on the platform by entering their name, email, and password. The system validates the provided information and securely stores it in the database.

Primary Actor 

Student

Secondary Actor 

 System 

Pre-Condition 

The user must have interest access and be on the registration page.

Post-Condition 

A new user account is created successfully, and a confirmation message is displayed.

Basic Flow 

Actor Action 

System Action 

 

The user enters name, email, and password then clicks “Register”.

Validates data, stores it in the database, and displays a confirmation message.

Alternate Flow 

If mandatory fields are missing or invalid, the system displays an error message and prompts the user to reenter the information



                                                                         Table 17 Use Case User Registration

                                                                        





























Use Case ID 

UC_02

Use Case Name 

Trainer Registration 

Description 

This use case allows a trainer to register by entering their name, email, password, training category, location and fee details. The system verifies all inputs and stores the trainer profile for future use.

Primary Actor 

Trainer 

Secondary Actor 

 System

Pre-Condition 

Trainer must have access to the registration interface and all required details.

Post-Condition 

Trainer profile is created successfully, and the system confirms registration.

Basic Flow 

Actor Action 

System Action 

 

Trainer enters required information including category, location, and price per session then submit the form.

Validates input, saves data, and confirms registration.

Alternate Flow 

If any required field is invalid or missing, the system notifies the trainer to correct the details before proceeding.

                  

                                                                                   Table 18 Trainer Registration

                                                                   

































Chapter 4: Design  





In this section, we provide the design analysis of our modules including the following designs  

Architecture Diagram  

ERD with data dictionary  

Data Flow diagram  

Class Diagram  

Activity Diagram  

Sequence Diagram  

Collaboration Diagram  

State Transition Diagram  

Component Diagram  

Deployment Diagram  





































 Architecture Diagram  





Figure 2 Architecture Diagram

















  ERD with data dictionary  

 





 

 

Figure 3 ERD







  Data Flow diagram  

Data flow diagram includes two levels  

The level 0 







                    





                                                        Figure 4 Level 0 DFD

The level 1 





         The flow of information outside the system is defined in this level  







Figure 5 Level 1 DFD



  Class Diagram  



 



Figure 6 Class Diagram

 

 

 





 Activity Diagram  



 Functional Requirements:



Session Scheduling:











 

Figure 7 Activity Diagram 



                                                              











User Dashboard:



















                                                                         Figure 8 Activity Diagram User Dashboard













                                                                        





























Trainer User Matching:











                                                                           Figure 9 Activity Diagram Trainer User Matching

























Trainer Registration:







                        

                                                                           Figure 10 Activity Diagram Trainer Registration

   

                                       











                                                                           Figure 11 Activity Diagram Trainer Registration



                                                                          





























Trainer Dashboard/ Login:









                                                                           Figure 12 Activity Diagram Trainer Dashboard/Login

   

                                                                          





















Combined:





                                                                          Figure 13 Activity Diagram Combined

                                                                          

   Sequence Diagram  





Figure 14 Sequence Diagram Create Account

 













   





                                                                   Figure 15 Sequence Diagram Student Booking & Smart Matching





















                                                                  Figure 16 Sequence Diagram AI-Assisted Virtual Session









  Collaboration Diagram  









                                                                                Figure 17 Collaboration Diagram









  State Transition Diagram  































































































 Combined:





                                                                  Figure 18 State Transition Diagram

 

 



  Component Diagram  

. 



                                                                               

                                                                              Figure 19 Component Diagram

 





 

 

 

 

 

 

 

Deployment Diagram  







                                                                                

                                                                                Figure 20 Deployment Diagram

























Chapter 5: Testing 



  Test Case Specifications 



This Testing phase includes all the Test Cases of the functional requirements of the project.  



Test Case for User Registration (FR_01): 



Positive Test Case 

ID 

 TC_USER_REG_SUCCESS

Priority 

High 

Description 

To verify that a new user can successfully register in the system.

Reference 

Functional Requirement FR_01

Users 

User

Pre-requisites 

A 

System is online.



B 

C

User has internet access.

User is on registration page.

Steps 

A 

Open the registration page.



B

C 

D

Enter full name.

Enter valid email address.

Enter password.



E

F 

Select fitness goal.

Click Register.

Input 

Valid user registration details

Expected result 

User account is successfully created and confirmation message is displayed.

Status 

Tested, Passed



Table 19 Positive Test Case for User Registration



















Negative Test Case 

ID 

TC_USER_REG_FAILURE

Priority 

High 

Description 

To verify that the system rejects incomplete or invalid user registration details.

Reference 

Functional Requirement FR_01

Users 

User

Pre-requisites 

A 

System is online.



B 

User has internet access



Steps 

A 

Open registration page.



B 

C

Leave required fields empty or enter invalid email.

Click Register.

Input 

Missing name / invalid email / weak password

Expected result 

Registration fails and system displays validation error message.

Status 

Tested, Passed



Table 20 Negative Test Case for User Registration





























 

Test Case for Trainer Registration (FR_02): 



Positive Test Case 

ID 

 TC_TRAINER_REG_SUCCESS

Priority 

High 

Description 

To verify that a trainer can successfully register with expertise and availability details.

Reference 

Functional Requirement FR_02

Users 

Trainer

Pre-requisites 

A 

System is online.



B

Trainer has internet access.



Steps 

A 

Open the trainer registration page.



B

C 

D

Enter name.

Enter valid email and password.

Select training category.



E

F

G 

Select expertise level.

Add available time slots.

Click Register.



Input 

Valid trainer details.

Expected result 

Trainer profile is successfully created and confirmation is displayed.

Status 

Tested, Passed



Table 21 Positive Test Case for Trainer Registration





























Negative Test Case 

ID 

 TC_TRAINER_REG_FAILURE

Priority 

High 

Description 

To verify that trainer registration fails when invalid or incomplete data is entered.

Reference 

Functional Requirement FR_02

Users 

Trainer

Pre-requisites 

A 

System is online.

Steps 

A 

Open trainer registration form.



B

C 



Leave expertise or availability blank.

Click Register.

Input 

  Incomplete trainer information.

Expected result 

System rejects registration and displays appropriate error.

Status 

Tested, Passed

     

Table 22 Negative Test Case for Trainer Registration





























 

Test Case for User Login (FR_03): 



Positive Test Case 

ID 

 TC_USER_LOGIN_SUCCESS

Priority 

High 

Description 

To verify successful login of registered user.

Reference 

Functional Requirement FR_03

Users 

User

Pre-requisites 

A 

System is online.



B 



User account exists.

Steps 

A 

Open the login page.



B

C 

D

Enter valid email.

Enter password.

Click Login.

Input 

Correct email and password.

Expected result 

User dashboard opens successfully.

Status 

Tested, Passed



Table 23 Positive Test Case for User Login





Negative Test Case 

ID 

 TC_USER_LOGIN_FAILURE

Priority 

High 

Description 

To verify that invalid login credentials are rejected.

Reference 

Functional Requirement FR_03

Users 

User

Pre-requisites 

A 

System is online.

Steps 

A 

Open login page.



B

C 

D

Enter email.

Enter password.

Click Login.

Input 

Incorrect credentials

Expected result 

Login fails and error message is displayed.

Status 

Tested, Passed



Table 24 Negative Test Case for User Login



 Test Case for Trainer Login (FR_04): 



Positive Test Case 

ID 

 TC_TRAINER_LOGIN_SUCCESS

Priority 

High 

Description 

To verify successful login of trainer.

Reference 

Functional Requirement FR_04

Users 

  Trainer

Pre-requisites 

A 

Registered trainer account exists.

Steps 

A 

Open the trainer login page.



B

C 



Enter valid credentials.

Click Login.

Input 

Correct Trainer Credentials.

Expected result 

Trainer dashboard loads successfully.

Status 

Tested, Passed



Table 25 Positive Test Case for Trainer Login





Negative Test Case 

ID 

 TC_TRAINER_LOGIN_FAILURE

Priority 

High 

Description 

To verify rejection of invalid trainer login credentials.

Reference 

Functional Requirement FR_04

Users 

Trainer

Pre-requisites 

A 

System is online.

Steps 

A 

Open trainer login page.



B

C 

D

Enter incorrect credentials.

Enter valid email address.

Click Login

Input 

Wrong Email password.

Expected result 

System denies access and displays error message.

Status 

Tested, Passed



Table 26 Negative Test Case for Trainer Login



 Test Case for Trainer User Matching (FR_05): 



Positive Test Case 

ID 

 TC_MATCHING_SUCCESS

Priority 

High 

Description 

To verify successful automatic trainer-user matching based on preferences and availability.

Reference 

Functional Requirement FR_05

Users 

User,Trainer.

Pre-requisites 

A 

User is registered.



B 

C

Trainer is registered.

Trainer availability exists.

Steps 

A 

User Login.



B

C 

Select fitness goal and preferred time slot.

Submit session request.

Input 

Valid matching request

Expected result 

Suitable trainer is assigned and both dashboards are updated..

Status 

Tested, Passed



Table 27 Positive Test Case for Trainer User Matching





Negative Test Case 

ID 

 TC_MATCHING_FAILURE

Priority 

High 

Description 

To verify system response when no trainer matches the request.

Reference 

Functional Requirement FR_05

Users 

User 

Pre-requisites 

A 

User account exists.



B

No trainer available for requested slot.



Steps 

A 

User submits session request with unavailable time.

Input 

No matching trainer availability

Expected result 

System shows no trainer available message or fallback option.

Status 

Tested, Passed



Table 28 Negative Test Case for Trainer User Matching



Test Case for Session Scheduling (FR_06):





Positive Test Case 

ID 

 TC_SESSION_SCHEDULE_SUCCESS

Priority 

High 

Description 

To verify that a user can successfully schedule a session with an available trainer.

Reference 

Functional Requirement FR_06

Users 

User

Pre-requisites 

A 

User is logged in.



B 

C

Trainer is available.

System is online.

Steps 

A 

Open session scheduling page.



B

C 

D

E 

Select preferred date.

Select available time slot.

Select training type.

Click Confirm Booking.

Input 

Valid scheduling details

Expected result 

Session is successfully booked and calendar/dashboard is updated.

Status 

Tested, Passed



Table 29 Positive Test Case for Session Scheduling



































Negative Test Case 

ID 

 TC_SESSION_SCHEDULE_FAILURE

Priority 

High 

Description 

To verify that the system prevents booking for unavailable trainer slots.

Reference 

Functional Requirement FR_06

Users 

User

Pre-requisites 

A 

User is logged in.

Steps 

A 

Open session scheduling page.



B

C 

Select already occupied or unavailable slot.

Click Confirm Booking.

Input 

Unavailable time slot

Expected result 

System rejects booking and displays availability error message.

Status 

Tested, Passed



Table 30 Negative Test Case for Session Scheduling













































Test Case for AI Powered Posture Estimation (FR_07):





Positive Test Case 

ID 

 TC_POSTURE _AI _SUCCESS

Priority 

High 

Description 

To verify that AI posture estimation analyzes exercise posture and provides corrective feedback.

Reference 

Functional Requirement FR_07

Users 

User

Pre-requisites 

A 

Webcam is connected and enabled.



B 

C

Internet connection available.

User is logged in.

Steps 

A 

Open AI posture module.



B

C 

Grant webcam access.

Start exercise session.

Input 

  Live webcam exercise feed

Expected result 

AI detects posture and displays real time feedback.

Status 

Tested, Passed



Table 31 Positive Test Case for AI Powered Posture Estimation





Negative Test Case 

ID 

 TC_POSTURE _AI _FAILURE

Priority 

High 

Description 

To verify system behavior when webcam access is denied or unavailable.

Reference 

Functional Requirement FR_07

Users 

User

Pre-requisites 

A 

User logged in.

Steps 

A 

Open posture estimation feature.



B

C 

Deny webcam permission.

Attempt to start workout.

Input 

  No webcam feed

Expected result 

System shows webcam access required message and AI session does not start.

Status 

Tested, Passed



Table 32 Negative Test Case for AI Powered Posture Estimation



Test Case for Live Online Session (FR_08):





Positive Test Case 

ID 

 TC_LIVE_SESSION_SUCCESS

Priority 

High 

Description 

To verify successful live video session between user and trainer.

Reference 

Functional Requirement FR_08

Users 

User, Trainer 

Pre-requisites 

A 

Session is scheduled.



B 

C

Stable internet available.

Camera/microphone enabled.

Steps 

A 

User joins session.



B

C 

Trainer accepts request.

Video session starts.

Input 

  Video/audio session request

Expected result 

Live communication is established successfully.

Status 

Tested, Passed



Table 33 Positive Test Case for Live Online Session





Negative Test Case 

ID 

 TC_LIVE_SESSION_FAILURE 

Priority 

High 

Description 

To verify failure handling when internet connection is unstable during live session.

Reference 

Functional Requirement FR_08

Users 

User, Trainer 

Pre-requisites 

A 

Scheduled session exists.

Steps 

A 

Attempt to join session with unstable network.

Input 

  Weak internet connection

Expected result 

System displays connection issue message or reconnect attempt.

Status 

Tested, Passed

 

Table 34 Negative Test Case for Live Online Session





Test Case for Admin Dashboard (FR_09):





Positive Test Case 

ID 

TC_ADMIN_DASHBOARD_SUCCESS

Priority 

High 

Description 

To verify that admin can successfully access centralized management dashboard.

Reference 

Functional Requirement FR_09 

Users 

Admin.

Pre-requisites 

A 

Valid admin account exists. 

Steps 

A 

Open admin login page.



B

C   

Enter valid credentials.

Click Login. 

Input 

Correct admin credentials.

Expected result 

Admin dashboard loads with users, trainers, sessions, and payment records.

Status 

Tested, passed. 



Table 35 Positive Test Case for Admin Dashboard





Negative Test Case 

ID 

TC_ADMIN_DASHBOARD_FAILURE

Priority 

High 

Description 

To verify unauthorized users cannot access admin dashboard.

Reference 

Functional Requirement FR_09

Users 

Unauthorized User.

Pre-requisites 

A 

System is online.

Steps 

A 

Attempt admin login using invalid credentials.

Input 

Incorrect admin credentials.

Expected result 

Access denied and error notification displayed.

Status 

Tested, passed. 



Table 36 Negative Test Case for Admin Dashboard









Test Case for Trainer Dashboard (FR_10):





Positive Test Case 

ID 

TC_TRAINER_DASHBOARD_SUCCESS

Priority 

High 

Description 

To verify trainer dashboard loads successfully with session and user details.

Reference 

Functional Requirement FR_10

Users 

Trainer.

Pre-requisites 

A 

Registered trainer account exists.

Steps 

A 

Login as trainer.



B 

Navigate to dashboard.

Input 

Valid trainer credentials.

Expected result 

Trainer dashboard loads with assigned sessions, feedback logs, and availability tools.

Status 

Tested, passed. 



Table 37 Positive Test Case for Trainer Dashboard





Negative Test Case 

ID 

TC_TRAINER_DASHBOARD_FAILURE

Priority 

High 

Description 

To verify trainer dashboard cannot be accessed without valid trainer account.

Reference 

Functional Requirement FR_10 

Users 

Trainer.

Pre-requisites 

A 

System is online.

Steps 

A 

Attempt login with invalid trainer credentials. 

Input 

Invalid trainer login.

Expected result 

Access denied and error message displayed.

Status 

Tested, passed. 



Table 38 Negative Test Case for Trainer Dashboard







Test Case for User Dashboard (FR_11):





Positive Test Case 

ID 

 TC_USER_DASHBOARD_SUCCESS

Priority 

High 

Description 

To verify that the user dashboard loads successfully with booked sessions, posture reports, and progress history. 

Reference 

Functional Requirement FR_11 

Users 

User. 

Pre-requisites 

A 

Registered user account exists.



B 

User is logged in.

Steps 

A 

Login as user.



B 

Navigate to dashboard.

Input 

Valid user credentials. 

Expected result 

User dashboard displays booked sessions, progress data, and posture feedback reports. 

Status 

Tested, passed. 



Table 39 Positive Test Case for User Dashboard





Negative Test Case 

ID 

TC_USER_DASHBOARD_FAILURE

Priority 

High 

Description 

To verify that unauthorized access to the user dashboard is prevented.

Reference 

Functional Requirement FR_11  

Users 

User.

Pre-requisites 

A 

System is online. 

Steps 

A 

Attempt to access dashboard without login or with invalid credentials.

Input 

Unauthorized access request.

Expected result 

System blocks access and displays login/authentication error message.

Status 

Tested, passed. 



Table 40 Negative Test Case for User Dashboard



Test Case for Payment and Subscription Handling (FR_12):





Positive Test Case 

ID 

TC_PAYMENT_SUCCESS

Priority 

High 

Description 

To verify successful payment processing and subscription activation.

Reference 

Functional Requirement FR_12

Users 

User.

Pre-requisites 

A 

User account exists. 



B 

Secure payment gateway available.

Steps 

A 

Login as user.



B 

Select subscription/package.



C 

Enter valid payment details.



D 

 

Confirm payment.

Input 

Valid card/wallet payment details.

Expected result 

Payment is processed successfully and subscription/session access is activated.

Status 

Tested, passed. 



Table 41 Positive Test Case for Payment and Subscription Handling

































Negative Test Case 

ID 

TC_PAYMENT_FAILURE

Priority 

High 

Description 

To verify system response for failed or invalid payment transactions.

Reference 

Functional Requirement FR_12

Users 

User.

Pre-requisites 

A 

Payment gateway active.

Steps 

A 

Select package.



B 

Enter invalid payment credentials.



C 

Confirm transaction.

Input 

Invalid card/wallet details.

Expected result 

Payment fails and transaction error message is displayed.

Status 

Tested, passed. 



Table 42 Negative Test Case for Payment and Subscription Handling













































Test Case for Session Tracking and Logs (FR_13):





Positive Test Case 

ID 

TC_SESSION_LOG_SUCCESS

Priority 

Medium

Description 

To verify that session details are correctly recorded and stored in the system.

Reference 

Functional Requirement FR_13

Users 

User, Trainer.

Pre-requisites 

A 

Session completed successfully.



B 

Database connection available.

Steps 

A 

Complete a training session.



B 

Open dashboard logs/history section.

Input 

Completed session participation data.

Expected result 

Session time, trainer participation, and related feedback are stored in logs.

Status 

Tested, passed. 



Table 43 Positive Test Case for Session Tracking and Logs





Negative Test Case 

ID 

TC_SESSION_LOG_FAILURE

Priority 

Medium

Description 

To verify system behavior when session log storage fails due to database issue.

Reference 

Functional Requirement FR_13

Users 

System.

Pre-requisites 

A 

Database unavailable/disconnected.

Steps 

A 

Complete a session while DB connection fails. 

Input 

Session data with failed DB connection.

Expected result 

System shows storage failure notification or retry mechanism.

Status 

Tested, passed. 



Table 44 Negative Test Case for Session Tracking and Logs



Test Case for Feedback and Progress Reports (FR_14):





Positive Test Case 

ID 

TC_PROGRESS_REPORT_SUCCESS

Priority 

Medium

Description 

To verify that user receives progress report after session completion.

Reference 

Functional Requirement FR_14

Users 

User, Trainer.

Pre-requisites 

A 

Session completed successfully.

Steps 

A 

Complete workout session.



B 

Trainer submits feedback / AI generates posture analysis.



C 

User opens reports section. 

Input 

Completed session data.

Expected result 

Progress report with trainer comments and AI posture feedback is generated successfully. 

Status 

Tested, passed. 



Table 45 Positive Test Case for Feedback and Progress Reports





Negative Test Case 

ID 

TC_PROGRESS_REPORT_FAILURE

Priority 

Medium

Description 

To verify that reports cannot be generated for incomplete sessions.

Reference 

Functional Requirement FR_14

Users 

User.

Pre-requisites 

A 

Session not completed.

Steps 

A 

Attempt to view report before session completion.

Input 

Incomplete session data.

Expected result 

System denies report generation and shows incomplete session message.

Status 

Tested, passed. 



Table 46 Negative Test Case for Feedback and Progress Reports





Test Case for Centralized Record Keeping (FR_15):





Positive Test Case 

ID 

TC_RECORDKEEPING_SUCCESS

Priority 

High 

Description 

To verify that centralized system records are securely stored and retrievable.

Reference 

Functional Requirement FR_15

Users 

Admin. 

Pre-requisites 

A 

Database active.



B 

Admin account exists.

Steps 

A 

Perform system activities (registration, payment, session completion).



B 

Login as admin. 



C 

Retrieve records.

Input 

System-generated records.

Expected result 

All user, trainer, payment, and session records are stored and accessible.

Status 

Tested, passed. 



Table 47 Positive Test Case for Centralized Record Keeping



Negative Test Case 

ID 

TC_RECORDKEEPING_FAILURE

Priority 

High 

Description 

To verify system response when centralized records cannot be retrieved due to database failure.

Reference 

Functional Requirement FR_15

Users 

Admin.

Pre-requisites 

A 

Database failure/disconnection.

Steps 

A 

Login as admin.



B 

Attempt to retrieve records.

Input 

Record retrieval request during DB failure.

Expected result 

System displays retrieval failure message or temporary unavailability notice.

Status 

Tested, passed. 



Table 48 Negative Test Case for Centralized Record Keeping



 Black Box Test Cases 



Black box testing was used in this project to verify whether the AI Enabled Gym Management and Virtual Fitness System performs its required functions correctly from the end user’s perspective. In this testing approach, the internal code structure is not considered; instead, the focus remains on validating system behavior by providing inputs and observing outputs.

For this project, black box testing was applied to major system functionalities such as user registration, trainer registration, secure login, trainer-user matching, session scheduling, AI-powered posture estimation, live online sessions, payment handling, dashboard access, and progress report generation. This testing approach helped ensure that the system behaves according to the defined functional requirements and delivers the expected results for different user interactions.

Black box testing also helped identify issues related to invalid input handling, incorrect responses, interface validation, and workflow failures. Since this platform is intended for real users including trainees, trainers, and administrators, testing from the user’s perspective was essential to ensure reliability and usability.



Equivalence Partitions (EP):

Equivalence partitioning was applied in this project to test system inputs by dividing them into valid and invalid categories. Instead of testing every possible input combination, representative values from each category were selected to verify whether the system handles user data correctly.

In the AI Enabled Gym Management and Virtual Fitness System, this technique was particularly useful for validating input fields used during registration, login, session booking, payment processing, and AI posture activation. Since these modules rely heavily on user-provided input, equivalence partitioning helped reduce unnecessary test cases while still ensuring effective validation coverage.



































Variables 

Valid Classes 

Invalid Classes 

Username 

1.  

2.

3. 



Only alphabets.

Minimum 7 characters

Compulsory field 

 

Digits or special symbols only

Empty field.

Email 

1.

2.

3.

Valid email format.

Contains “@” and domain name.

Compulsory field.

Email without “@”.

Invalid domain format.

Empty field.

  

Password

1.



2.



3.

Length should be greater than 7 characters.

May contain alphabets, digits and symbols.

Compulsory field

 Length less than 7 characters.

Empty field.

Fitness Goal

 

User selects a valid goal such as weight loss, muscle gain, or general fitness.

  1.    No fitness goal selected.

Trainer Expertise 

  1.      

Trainer selects valid expertise level such as beginner, intermediate or expert. 

  1. Expertise field left empty.

Time Slot 

  1.

Available trainer time slot is available.

  1. Already booked or unavailable         time slot selected.

Payment Details

  1.

Valid card or wallet details are entered.

 Invalid card/wallet details.

 Empty payment details.



Webcam Access

  1.

Webcam permission is allowed for posture estimation.

Webcam permission is denied.

 Webcam device is not available.

























Boundary Value Analysis 

Boundary value analysis was used in this project to test input values at their acceptable limits. This technique is useful because system errors often occur at minimum or maximum boundaries rather than normal values.

For the AI Enabled Gym Management and Virtual Fitness System, this testing approach was applied to inputs such as username length, password length, payment amount, and session scheduling constraints. For example, if the system requires a password longer than five characters, then values below, equal to, and above this limit must be tested to ensure correct validation behavior.



Input Field

Minimum Boundary

Valid Boundary

Maximum Boundary

Invalid Boundary

User Name

2 characters

3 characters

30 characters

Empty / 31+

Password

6 characters

7 characters

20 characters

Less than 5

Payment Amount

Minimum package fee

Valid subscription fee

Highest package fee

Zero / negative

Session Duration

30 minutes 

45 minutes

60 minutes

Less than 30 / above 60



Decision Table Testing 



Decision table testing is used when the system output depends on different combinations of conditions. In the AI Enabled Gym Management and Virtual Fitness System, this technique is useful for testing trainer-user matching and session booking.

For example, a session should be confirmed only when the user is registered, the trainer is available, and the selected time slot is free. If any one of these conditions is false, the system should not confirm the session and should display an appropriate message.









User Registered 

Trainer Available 

Time Slot Available 

Expected Result 

Yes 

Yes

Yes

Session is booked successfully.

Yes

No

Yes

System shows trainer not available.

Yes

Yes

No

System shows time slot unavailable.

No 

Yes

Yes

System asks user to login/register first.



State transition Testing 

State transition testing was applied in this project to verify how the system behaves when moving from one operational state to another based on user actions or system responses.

In the AI Enabled Gym Management and Virtual Fitness System, this technique was particularly relevant for session lifecycle management. A session does not remain in one fixed condition; instead, it moves through multiple states depending on actions taken by users and trainers.

For example, when a user requests a session, the system places it in a requested state. Once the trainer confirms availability, the state changes to confirmed. When the live workout begins, the state becomes started. After successful completion, it moves to completed. If the trainer or user cancels the booking, the session changes to cancelled.

Testing these transitions helped ensure correct workflow progression and reliable session management.



Use Case Testing 



Use case testing was used in this project to validate complete end-to-end user workflows based on actual system interactions. This testing approach focuses on verifying whether the system performs correctly when users follow realistic operational scenarios.

For the AI Enabled Gym Management and Virtual Fitness System, use case testing was applied to important workflows such as account registration, secure login, trainer matching, booking a session, making payments, joining live sessions, and viewing progress reports.



For example, a typical use case begins with a user registering an account, logging into the system, selecting a fitness goal, requesting a trainer, booking a session, completing payment, joining the live training session, and finally viewing progress feedback through the dashboard.

This testing ensured that complete business workflows function smoothly without interruption and that different modules integrate correctly with one another.



White Box Test Cases 

White box testing was considered in this project to evaluate the internal working logic of the AI Enabled Gym Management and Virtual Fitness System. Unlike black box testing, which focuses on system behavior from the user’s perspective, white box testing examines the internal flow of logic, conditions, and execution paths to ensure that the implemented modules behave correctly at code level.

In this project, white box testing was particularly relevant for validating internal functionalities such as user authentication, trainer-user matching logic, session scheduling conditions, payment verification flow, and AI posture processing logic. Since the system contains multiple decision-based workflows and validation checks, examining the logical flow helped ensure that the implementation behaves accurately under different internal conditions.

Cyclometric complexity 

Cyclomatic complexity was used as a structural testing metric to evaluate the logical complexity of decision-based modules in the system. This technique helps estimate the number of independent execution paths in a program, allowing developers to understand how complex a specific module is and how many test paths are required for effective testing.

For the AI Enabled Gym Management and Virtual Fitness System, this concept is particularly relevant to modules containing multiple conditional decisions such as trainer-user matching, login authentication, and session scheduling.

For example, in the session scheduling module, the system performs several decision checks before confirming a booking. It verifies whether the user is authenticated, whether the trainer is available, whether the selected time slot is free, and whether payment has been completed successfully. Each decision increases the logical complexity of the module.

A lower cyclomatic complexity indicates that the module is easier to understand, maintain, and test, while higher complexity suggests increased testing effort and greater chances of hidden logical errors.



 Performance testing 

Performance testing was carried out to evaluate how efficiently the AI Enabled Gym Management and Virtual Fitness System performs under expected operational conditions. Since this platform includes real-time interactions such as live online sessions, dashboard access, AI posture feedback, and session scheduling, maintaining acceptable responsiveness is essential for user satisfaction.

In this project, performance testing focused on system response time, dashboard loading speed, AI posture feedback generation, and payment transaction processing. The purpose was to ensure that the platform remains responsive when multiple users interact with the system simultaneously.

For example, when users log in to access dashboards, the system should load relevant data within an acceptable time without unnecessary delay. Similarly, the AI posture estimation module should provide corrective feedback quickly enough to remain useful during live exercise sessions. Performance testing helped verify that the system delivers smooth operation under realistic usage conditions.

 Stress Testing 

Stress testing was considered to examine how the AI Enabled Gym Management and Virtual Fitness System behaves under extreme or abnormal workload conditions. Since the platform may experience peak usage during popular workout hours when multiple users attempt to book sessions, access dashboards, or initiate live training simultaneously, testing system stability under pressure was important.

In this project, stress testing focused on situations where system resources may become overloaded, such as excessive simultaneous login attempts, multiple live session requests, or heavy AI posture estimation activity occurring at the same time.

The purpose of this testing was to observe whether the system remains stable, slows down gracefully, or fails unexpectedly under excessive demand. It also helped assess the recovery capability of the system after stress conditions are removed.

For example, if many users attempt to initiate live sessions at once, the system should either handle the load efficiently or provide controlled responses rather than crashing completely.





 System Testing 

System testing was performed to evaluate the complete AI Enabled Gym Management and Virtual Fitness System as an integrated application. This testing ensured that all modules function correctly together as a unified system rather than as isolated components.

The testing covered the interaction between registration, authentication, trainer-user matching, session scheduling, live communication, AI posture estimation, payment processing, dashboard access, progress tracking, and centralized administration.

The main objective of system testing was to verify whether the complete platform fulfills the specified functional and non-functional requirements in a realistic environment.

For example, a complete system workflow may involve a user registering an account, logging in, selecting a fitness goal, being matched with a trainer, booking a session, completing payment, joining a live workout, receiving posture feedback, and later reviewing progress reports. System testing confirmed that these interconnected modules operate correctly without workflow interruption.

 Regression Testing 

Regression testing was performed to ensure that modifications, updates, or corrections made during the development of the AI Enabled Gym Management and Virtual Fitness System did not negatively affect previously working functionalities.

Since the system consists of multiple interconnected modules, even minor changes in one component could unintentionally impact the behavior of other functionalities. Regression testing was therefore carried out to verify that existing features continued to function correctly after system updates, bug fixes, or enhancements.

For instance, modifications in the trainer-user matching module could potentially affect session scheduling functionality, while updates in payment verification might influence subscription access or dashboard operations. Regression testing helped ensure that such changes did not introduce unintended defects into previously stable modules.

This testing contributed to maintaining overall system stability and consistency throughout the development lifecycle.









Final Regression Tests   

Final regression testing was performed to validate the stability of the AI Enabled Gym Management and Virtual Fitness System before final deployment. This testing ensured that the final system build remained stable and that all previously implemented functionalities continued to operate correctly without unexpected failures.

For this project, final regression testing focused on complete workflows including user registration, authentication, trainer-user matching, session scheduling, payment handling, live session access, AI-powered posture estimation, dashboard functionality, and progress report generation. The purpose was to confirm that the final version of the system was reliable and ready for deployment.

Regression Tests 

Normal regression testing was carried out throughout the development phase whenever updates, bug fixes, or feature enhancements were introduced into the system. Since the project consists of multiple interconnected modules, even small changes in one component could potentially affect the behavior of other functionalities.

For example, modifications in session scheduling logic could impact trainer availability handling, while updates in payment verification could affect subscription access. Regression testing helped ensure that newly introduced changes did not break previously working modules and that overall system behavior remained consistent after updates.

Selecting Regression Tests 

The regression test cases for this project were selected based on the modules that were most likely to be affected by code changes and system updates.

The selection criteria included:

Functionalities directly modified during development 

Modules with multiple dependent workflows 

Frequently used system features 

Critical functionalities affecting core system operations 

Features with previous defects or validation issues 

For this project, priority regression areas included:

User and trainer authentication 

Trainer-user matching 

Session scheduling 

Payment and subscription handling 

Dashboard access 

AI posture estimation 

Session tracking and progress reports

Regression Testing Steps 

The regression testing process followed in this project included the following steps:

Identify functionalities affected by recent system changes 

Select previously executed test cases relevant to impacted modules 

Re-execute test scenarios under updated system conditions 

Verify that existing functionalities continue to operate correctly 

Record any newly introduced defects 

Retest corrected modules where necessary 

Confirm complete workflow stability after fixes





Chapter 6: Tools and Techniques 



This chapter includes the following 

Languages you are using in the development  

Applications and tools 

Libraries and Extensions if any 



Chapter 7: Summary and Conclusion 



This chapter include the summary and the conclusion 



Chapter 8: User Manual 



User manual is an important part of an application documentation. It is a guide for users on operations within the application. Follow section of this document will provide detailed guide on how to use features of application.  

let take the login function as an example  

This is the login authentication screen from where the user can log in to the system. User must have 

Active username and password. 

Web login address. 

Steps: 

Open login webpage 

Enter login details. 

Click Login. 

Done. 



Chapter 9: Lessons Learnt and Future Work 



In this chapter you will explain the lesson learned from the project and future work that is not the part of your project but you want to do in future.













































Landing/Home Page:







Home page of the TrainerLocator System:

From this screen users can explore the platform and navigate to login to start using the system.



















Login Screen:







Users are required to enter their email address and password to access the system dashboard.





















Register Screen:







This screen allows user to create an account on the TrainerLocator system Users are required to provide their name, email, address, and password and select their role before creating an account.



















Dashboard:







This dashboard is displayed after successful login. It provides users with an overview of available trainers and filtering options

















Main Feature:























This screen represents the core functionality of the trainerlocator system user can view trainers along with their rating, pricing, and specialization and can book training sessions based on their preferences.





References

 



 I. Sommerville, Software Engineering, 10th ed. Boston, MA: Pearson Education, 2016.





 R. Szeliski, “Computer vision: Algorithms and applications,” in Computer Vision, 2nd ed., London, UK: Springer, 2022, pp. 45–78.





 S. Russell and P. Norvig, Artificial Intelligence: A Modern Approach, 4th ed. [Online]. Available: https://aima.cs.berkeley.edu 





 Z. Cao, T. Simon, S. E. Wei, and Y. Sheikh, “Realtime multi-person 2D pose estimation using part affinity fields,” IEEE Transactions on Pattern Analysis and Machine Intelligence, vol. 43, no. 1, pp. 172–186, Jan. 2021.



 Y. Chen and L. Zhang, “AI-based fitness posture recognition using deep learning,”    Journal of Artificial Intelligence Research [Online], vol. 68, pp. 112–125, 2020. Available: https://www.jair.org 



 F. Zhang, Y. Liu, and M. Wang, “Human posture detection for fitness training using computer vision,” in Proc. International Conference on Computer Vision and Pattern Recognition, Seoul, South Korea, 2019, pp. 221–228.



 A. Khan, “AI-based human posture analysis for physical training applications,” M.S. thesis, Dept. Computer Science, University of Lahore, Lahore, Pakistan, 2022.



 Google AI, “Pose estimation using MediaPipe,” Technical Documentation [Online],2023. https://developers.google.com/mediapipe/solutions/vision/pose_landmarker 











 Google Developers, “MediaPipe pose estimation,” 2023. [Online]. Available: https://developers.google.com/mediapipe



World Health Organization, “Physical activity and fitness guidelines,” 2022. [Online]. Available: https://www.who.int





Appendix 



This phase of the project does not include any additional supplementary material.