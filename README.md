# FireTag

FireTag is an add-on for Mozilla Firefox and Thunderbird.
It creates an annotation sidebar that is visible next to a webpage or email in view and shows relevant concepts (think: "tags") for the text viewed.

FireTag requires a connection to a so-called PIMO server (PIMO = Personal Information Model) which contains all known concepts for the user and a group he or she belongs to.
The PIMO stores all annotations (of the user and of the group) and can also analyze the text and suggest other concepts occurring in the text, etc.
The FireTag sidebar uses this service and presents annotated and suggested concepts accordingly.


## How to build an xpi package for distribution

* Open *code/defaults/preferences/firetag.js* and increase the value of the preference `extensions.dfki.FireTag.installVersion` (first line)
* Call `ant` from the root directory of the project.
* `git tag TAGNAME` whereas the TAGNAME should be the new version number (e.g., `0.7.8`)
* `git push --tags`

## Contact

* FireTag: [@wagnerand](https://github.com/wagnerand) (<Andreas.Wagner@dfki.de>)
* PIMO: [@svenschwarz](https://github.com/svenschwarz) (<Sven.Schwarz@dfki.de>)
