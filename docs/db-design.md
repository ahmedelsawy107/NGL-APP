# DATABASE DESIGN

* User

- name -> [String - required - minlength:3 - maxlength:20 - trim:true]
- email -> [String - required - unique:true - trim:true - lowercase:true]
- password -> [String - in-case provider = local >> required]
- provider [Google - Facebook - 'local']
- isDeleted [boolean] - [default:false]
- isVerified [boolean] - [default:false]
- dob [Date]
- gender [String] - [Male - Female]
- crearedAt [Date]
- updatedAt [Date]


* Message 

- content -> [String - required - trim:true - minlength:1 - maxlength:200]
- receiver -> [ObjectId - required - ref:'User']
- sender -> [ObjectId - ref:'User']
- isDeleted -> [boolean] - [default: false]
- createdAt -> [Date]
- updatedAt -> [Date]


* OTP 

- code -> [String - required - length:6]
- email -> [String - required - trim:true - lowercase:true]
- expiresAt -> [Date]
- createdAt -> [Date]