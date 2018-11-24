library(tidyverse)
library(jsonlite)

#From Chad:
#All the data will be uploaded here: 
dir_data <- "https://app.box.com/v/BMPPOpptyInd-Interactive"

#downloadable data for each metro area here: 
dir_download <- "https://app.box.com/v/BMPPOI-MetroJobShares"

#vars in flow data
#occ_a - SOC of starting occ
#titlea - Title of starting occ
#occ_b - SOC of ending occ
#titleb - Title of ending occ

#p_h_wage - Hourly wage in starting occ
#p_a_wage - Annual wage in starting occ
#f_h_wage – Hourly wage in ending occ
#f_a_wage – Annual wage in ending occ

#probs - Share of employed in starting occ that end up in ending occ
#opportunity - Share of employed in starting occ that will hold a good job when they reach the ending occ
#other – Share of employed in starting occ that do not have and will not have a good job at start or end of pathway
#weight – Raw person weight (number of employed in that starting occ meeting personal descriptors as implied by ACS data) – ignore this
  
mspflow <- read_csv("/home/alec/Projects/Brookings/opportunity-industries/build/data/flat_files/33460 Minneapolis MN-WI 3digit flows.csv")

mspflow2 <- mspflow %>% filter(gender=="Total", age=="Total", race=="Total", education=="Total")
unique(mspflow2$occ_a)
length(unique(mspflow2$occ_b))


#to json
#data questions: any differences b/n occa/titlea and b?
#redo so that start occs is a single array of data -- avoid repeating wage data 95 times for each occ -- not sure if kosher
dict <- mspflow %>% select(occ_a, titlea) %>% 
          as.data.frame %>% unique() %>% 
          filter(!duplicated(occ_a)) %>% 
          spread(occ_a, titlea)

dat <- mspflow2 %>% select(occ_a, occ_b, sw=p_a_wage, ew=f_a_wage, opp=opportunity, oth=other) %>% as.data.frame() %>% split(.$occ_a)

sum_probs <- mspflow2 %>% group_by(occ_a, titlea) %>% summarise(share=sum(probs))

json <- toJSON(dat, na="null", digits=5, pretty=TRUE)

writeLines(json, con="/home/alec/Projects/Brookings/opportunity-industries/data/msp.json")

writeLines(c("var start_occs = ", toJSON(dict, pretty=TRUE), ";", "export default start_occs;",""), 
           con="/home/alec/Projects/Brookings/opportunity-industries/build/js/start-occs.js")
