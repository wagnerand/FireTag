# FireTag

FireTag is an Addon for Mozilla Firefox and Thunderbird.
It creates an annotation sidebar that is visible next to a webpage or email in view and shows relevant concepts (think: "tags") for the text viewed.

FireTag requires a connection to a so-called PIMO server (PIMO = Personal Information Model) which contains all known concepts for the user and a group he or she belongs to.
The PIMO stores all annotations (of the user and of the group) and can also analyze the text and suggest other concepts occurring in the text, etc.
The FireTag sidebar uses this service and presents annotated and suggested concepts accordingly.


## How to build an xpi package for distribution

* Edit `code/defaults/preferences/firetag.js` and increase the value of the preference `extensions.dfki.FireTag.installVersion` (first line)
* Call `ant` from the root directory of the project.


## Contact

FireTag: @wagnerand (<Andreas.Wagner@dfki.de>)
PIMO: @svenschwarz (<Sven.Schwarz@dfki.de>)
